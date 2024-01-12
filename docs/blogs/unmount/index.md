# 组件卸载

前面我们讲述了组件的挂载、更新等流程。接下来我们深入了解下组件卸载流程，这样我们整个流程就完整了。卸载流程主要由`unmount`、`unmountComponent`、`unmountChildren`三个函数控制。

## 什么时候会触发组件卸载

组件卸载通常发生在以下几种情况：

1. 当我们使用 `v-if` 指令，并且条件为 `false` 时，组件会被卸载。
2. 当我们使用 `v-for` 指令，并且列表中的某个元素被移除时，对应的组件会被卸载。
3. 当我们使用 `router-view` 进行路由切换时，旧的路由组件会被卸载。
4. 当我们手动调用 `app.unmount()` 方法时，根组件会被卸载。
5. `keep-alive`超过最大缓存个数

当我们我们在调用`patch`进行组件渲染的时候会执行以下函数：

```js
if (n1 && !isSameVNodeType(n1, n2)) { // 如果新旧vnode节点，type类型不同，则直接卸载旧节点
  anchor = getNextHostNode(n1)
  unmount(n1, parentComponent, parentSuspense, true) // 卸载逻辑
  n1 = null
}
```

当我们存在旧节点，并且新节点类型不同或者不存在的时候就会调用`unmount`执行节点的挂载，我们来具体看看`unmount`函数的实现。


## unmount

```typescript
const unmount = (
    vnode,
    parentComponent,
    parentSuspense,
    doRemove = false,
    optimized = false
  ) => {
    const {
      type, //实例的类型
      props,
      ref,
      children,
      dynamicChildren, // 动态节点
      shapeFlag, //当前vnode类型
      patchFlag,
      dirs // 自定义指令
    } = vnode
    // unset ref 重置ref
    if (ref != null) {
      setRef(ref, null, parentSuspense, vnode, true)
    }

    // keep-alive组件单独处理，不走常规卸载逻辑
    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      ;(parentComponent!.ctx as KeepAliveContext).deactivate(vnode)
      return
    }

    //是否执行自定义指令的钩子
    const shouldInvokeDirs = shapeFlag & ShapeFlags.ELEMENT && dirs
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode) // 执行onVnodeBeforeUnmount函数

    let vnodeHook: VNodeHook | undefined | null
    if (
      shouldInvokeVnodeHook &&
      (vnodeHook = props && props.onVnodeBeforeUnmount)
    ) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode)
    }
 		// 组件类型卸载
    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode.component!, parentSuspense, doRemove)
    } else { // 非组件类型卸载
      if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) { // 卸载suspense
        vnode.suspense!.unmount(parentSuspense, doRemove)
        return
      }

      if (shouldInvokeDirs) { // 调用自定义指令的beforeUnmount钩子
        invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount')
      }

      if (shapeFlag & ShapeFlags.TELEPORT) { // teleport组件卸载
        ;(vnode.type as typeof TeleportImpl).remove(
          vnode,
          parentComponent,
          parentSuspense,
          optimized,
          internals,
          doRemove
        )
      } else if ( // 稳定的Fragment或者非Fragment类型，采用dynamicChildren走快速通道进行卸载
        dynamicChildren &&
        (type !== Fragment ||
          (patchFlag > 0 && patchFlag & PatchFlags.STABLE_FRAGMENT))
      ) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        )
      } else if ( //处理fragment是keyed和unkeyed的情况以及children是数组的情况
        /**
         * UNKEYED_FRAGMENT、KEYED_FRAGMENT:不稳定的Fragment。
         * 首先只要使用了v-for指令那么就会包裹一层Fragment类型节点,当我们写出<div v-for="a in b"></div>这样的代码,这就是UNKEYED_FRAGMENT类型
         * 当我们写出<div v-for="a in b" :key="a"></div>这样的代码,这就是KEYED_FRAGMENT类型
         * 他们都是不稳定的Fragment类型节点。
         */
        (type === Fragment &&
          patchFlag &
            (PatchFlags.KEYED_FRAGMENT | PatchFlags.UNKEYED_FRAGMENT)) ||
        (!optimized && shapeFlag & ShapeFlags.ARRAY_CHILDREN)
      ) {
        unmountChildren(children as VNode[], parentComponent, parentSuspense)
      }

      if (doRemove) { // 移除真实dom，只有父节点才会卸载，子节点都不用
        remove(vnode)
      }
    }

    if (
      (shouldInvokeVnodeHook &&
        (vnodeHook = props && props.onVnodeUnmounted)) ||
      shouldInvokeDirs
    ) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode)
        shouldInvokeDirs &&
          invokeDirectiveHook(vnode, null, parentComponent, 'unmounted') // 调用自定义指令的unmounted方式，放入后置队列
      }, parentSuspense)
    }
  }
```

可以看到 `unmount` 的主要逻辑如下

1. 将所有的`ref`设置为`null`
2. 是不是`keep-alive`组件，是的话需要缓存，不走卸载逻辑
3. 判断当前节点的类型，需要区分组件类型和非组件
4. 调用指令的`unmounted`钩子函数，需要注意的是要将函数放入后置队列执行，因为要等组件卸载完之后再调用。

**对于非组件类型**

1. `suspense`组件特殊处理
2. 调用当前节点自定义指令的`beforeUnmount钩子`。这个是同步调用的
3. `teleport`组件特殊处理
4. 处理有动态孩子`dynamicChildren`的节点，并且节点需要是稳定的`fragment`或者非`fragment`类型。这时会直接走快速通道，我们只有遍历`dynamicChildren`里面的所有节点就好了，节约性能
5. 处理不稳定的`fragment`或者数字类型的`children`节点。遍历`children`进行卸载

> 两种遍历孩子节点调用的方法都是`unmountChildren`，唯一不同的是我们传入进去的孩子节点不同。`unmountChildren`内部其实就是循环，对每个孩子都调用`unmount`进行卸载。

::: tip

为什么需要区分稳定的`fragment`和非稳定的`fragment`呢。我们知道`vue3`在编译的时候会进行优化，会将动态节点放入`dynamicChildren`中。但是对于`v-if`和`v-for`这种，节点是不稳定的。**对于不稳定的`Fragment节点`,无法收集`dynamicHildren属性`,这是因为使用了`v-for`渲染列表之后,新旧节点在数组中的顺序可能发生了改变违背了`dynamicChilren`一一比较的原则,所以对于使用`v-for`渲染的`Fragment类型节点`禁止收集`dynamicChilren`。那么对于稳定的`Fragment节点`则允许收集所以可以直接卸载`dynamicChildren`即可**。

:::

**对于组件类型**

1. 调用`unmountComponent`进行组件的卸载

## unmountComponent

```typescript
const unmountComponent = (
    instance: ComponentInternalInstance,
    parentSuspense: SuspenseBoundary | null,
    doRemove?: boolean
  ) => {
    const { bum, scope, update, subTree, um } = instance

    // 调用 beforeUnmount钩子
    if (bum) {
      invokeArrayFns(bum)
    }

    if (
      __COMPAT__ &&
      isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
    ) {
      instance.emit('hook:beforeDestroy')
    }

    scope.stop()

    if (update) {
      update.active = false // 让组件实例的更新任务立即失活,即使当前更新任务还在调度器队列当中也不会执行。
      unmount(subTree, instance, parentSuspense, doRemove) // 卸载组件的子节点。
    }
    // unmounted hook // 调用unmounted钩子
    if (um) {
      queuePostRenderEffect(um, parentSuspense)
    }
    if (
      __COMPAT__ &&
      isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
    ) {
      queuePostRenderEffect(
        () => instance.emit('hook:destroyed'),
        parentSuspense
      )
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true // 标记为已经卸载
    }, parentSuspense)

    // suspense组件的处理
    if (
      __FEATURE_SUSPENSE__ &&
      parentSuspense &&
      parentSuspense.pendingBranch &&
      !parentSuspense.isUnmounted &&
      instance.asyncDep &&
      !instance.asyncResolved &&
      instance.suspenseId === parentSuspense.pendingId
    ) {
      parentSuspense.deps--
      if (parentSuspense.deps === 0) {
        parentSuspense.resolve()
      }
    }
  }
```

组件卸载的流程也比较清晰，主要执行以下几件事

1. 同步调用`beforeUnmount`钩子函数

2. 对于有`update`属性的组件（也就是有副作用函数的组件）我们设置`update`的`active`属性为`false`

   >```typescript
   >const update: SchedulerJob = (instance.update = () => effect.run())
   >update.id = instance.uid // 这个id在flush job的时候排序用到的
   >```
   >
   >我们在组件初始化的时候会将`update`赋值给实例。`update`实际上就是调度器里面的一个任务。在调度器执行任务的时候会有这样一个判断：
   >
   >```typescript
   >if (job && job.active !== false) {
   >  callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
   >}
   >```
   >
   >当我们的任务`active`为`false`的时候就不会执行这个任务，所以我们卸载的时候设置为`false`就可以保证以后都不运行这个卸载组件的副作用了

3. 调用`unmount`卸载子节点`subtree`

4. 将`unmount钩子函数`放入调度器后置队列中,后置队列没有优先级,先放入先执行。**但是子组件的卸载在父组件卸载之前,所以子组件的`unmount钩子函数`会先放入调度器后置队列当中,保证执行钩子的执行顺序不会错误**。

5. 在完成卸载后标识当前组件已经被卸载。

## 卸载真实`dom`

完成了上述操作，我们只是完成了和虚拟`dom`卸载相关的以下操作，我们的真实`dom`还是存在在页面上。最后会调用`remove`进行卸载。

```js
if (doRemove) { // 移除真实dom，只有父节点才会卸载，子节点都不用
  remove(vnode)
}
```

`vue`在这里做了一个优化，我们卸载的时候会判断`doRemove`为真才会执行卸载逻辑，我们在调用`unmountChildren`的时候这个值时`false`，这样就保证了我们在卸载的时候只需要对需要卸载的根节点调用`remove`就行了，将多次`dom`操作变为一次

```typescript
const remove: RemoveFn = vnode => {
    const { type, el, anchor, transition } = vnode
    if (type === Fragment) { // 卸载fragment
      //el代表开始的空文本节点 anchor代表最后的空文本节点
      removeFragment(el!, anchor!) // 删除el anchor在内的所有节点
      return
    }

    if (type === Static) { // 移除静态节点
      removeStaticNode(vnode)
      return
    }

    const performRemove = () => {
      hostRemove(el!) // 移除原生dom，浏览器环境下就是调用parent.removeChild
      if (transition && !transition.persisted && transition.afterLeave) { // 动画效果
        transition.afterLeave()
      }
    }

    if (
      vnode.shapeFlag & ShapeFlags.ELEMENT &&
      transition &&
      !transition.persisted
    ) {
      const { leave, delayLeave } = transition
      const performLeave = () => leave(el!, performRemove)
      if (delayLeave) {
        delayLeave(vnode.el!, performRemove, performLeave)
      } else {
        performLeave()
      }
    } else {
      performRemove()
    }
  }
```

`remove`逻辑很简单

1. 对于`fragment`组件除了需要移除所有节点包括我们之前创建的`anchor`节点。
2. 对于静态节点调用原生的`removeChild`方法进行卸载（注意：`removeChild`是从`runtime-dom`中注入进来的，因为我们的`runtime-core`是与平台无关的）
3. 对于元素节点，我们直接卸载就行了。对于用了`transition`动画的，调用动画就行。

## 总结

上面就完成了我们组件卸载的所有流程。组件的卸载主要包括以下内容：

1. 销毁组件实例。
2. 卸载子组件。
3. 移除事件监听器。
4. 调用自定义指令钩子函数和组件生命周期函数。