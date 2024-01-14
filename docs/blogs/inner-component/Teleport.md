# Vue3 Teleport的深入理解与源码解析

## 介绍

在Vue2中，我们经常遇到这样的问题：我们希望将一个组件渲染到DOM结构中的某个特定位置，但是由于Vue的组件化特性，我们只能将组件渲染到父组件的模板中。这对于一些特殊场景（如全屏模态框，通知，提示等）来说，可能会导致样式问题，或者z-index层级问题。

为了解决这个问题，Vue3引入了Teleport组件。Teleport可以帮助我们将组件的模板部分"传送"到DOM的任意位置，而不仅仅是局限于父组件的模板中。这样，我们就可以更加灵活地控制组件的渲染位置。

## 基本用法

**属性值**

| Props    | 是否必填 | 描述                                                         |
| -------- | -------- | ------------------------------------------------------------ |
| to       | 是       | 指定目标容器，必须是有效的查询选择器或 HTMLElement           |
| disabled | 否       | 当值为 true 时，内容将保留在其原始位置，而不是指定的目标位置中。可以动态更改该属性。 |

Teleport的基本用法非常简单。你只需要在你的模板中添加`<teleport>`标签，并使用`to`属性指定你想要将模板传送到的目标位置即可。如下所示：

```vue
<teleport to="#end-of-body">
  <div>This will be teleported to #end-of-body</div>
</teleport>
```

在上面的代码中，`<div>`标签及其内容将被"传送"到id为"end-of-body"的DOM元素中。

### 禁用Teleport

在某些场景下可能需要视情况禁用 `<Teleport>`。举例来说，我们想要在桌面端将一个组件当做浮层来渲染，但在移动端则当作行内组件。我们可以通过对 `<Teleport>` 动态地传入一个 `disabled` prop 来处理这两种不同情况。

template

```vue
<Teleport :disabled="isMobile">
  ...
</Teleport>
```

这里的 `isMobile` 状态可以根据 CSS media query 的不同结果动态地更新。

### 多个Teleport共享目标

一个可重用的模态框组件可能同时存在多个实例。对于此类场景，多个 `<Teleport>` 组件可以将其内容挂载在同一个目标元素上，而顺序就是简单的顺次追加，后挂载的将排在目标元素下更后面的位置上。

比如下面这样的用例：

```vue
<Teleport to="#modals">
  <div>A</div>
</Teleport>
<Teleport to="#modals">
  <div>B</div>
</Teleport>
```

渲染的结果为：

```html
<div id="modals">
  <div>A</div>
  <div>B</div>
</div>
```

## 使用Teleport的场景和注意事项

Teleport最常见的使用场景包括但不限于：模态框，提示框，通知等。这些场景中，我们通常希望组件能够渲染到DOM的特定位置，而不是局限于父组件的模板中。

在使用Teleport时，有一些需要注意的地方：

- Teleport的目标位置必须是一个有效的DOM元素，你可以使用CSS选择器来指定它。
- `<Teleport>` 只改变了渲染的 DOM 结构，它不会影响组件间的逻辑关系。也就是说，如果 `<Teleport>` 包含了一个组件，那么该组件始终和这个使用了 `<teleport>` 的组件保持逻辑上的父子关系。传入的 props 和触发的事件也会照常工作。这也意味着来自父组件的注入也会按预期工作，子组件将在 Vue Devtools 中嵌套在父级组件下面，而不是放在实际内容移动到的地方。
- `<Teleport>` 挂载时，传送的 `to` 目标必须已经存在于 DOM 中。理想情况下，这应该是整个 Vue 应用 DOM 树外部的一个元素。如果目标元素也是由 Vue 渲染的，你需要确保在挂载 `<Teleport>` 之前先挂载该元素。

## 源码解析

> Teleport的源码位于`core/packages/runtime-core/src/components/Teleport.ts`

```vue
<teleport to="body">
  <div>This will be teleported to body</div>
</teleport>
```

我们以这个模版为例。经过`vue`的模版解析后会变为如下内容：

```js
const _hoisted_1 = /*#__PURE__*/_createElementVNode("div", null, "This will be teleported to body", -1 /* HOISTED */)

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createBlock(_Teleport, { to: "body" }, [
    _hoisted_1
  ]))
}
```

可以看到，我们的`Teleport`组件会被一个`block`包裹起来，`Teleport`的子节点都会变成虚拟`dom`里面的`children`属性。

在后续应用渲染的时候会调用`patch`，对于`teleport`组件会走到以下逻辑：

```js
if (shapeFlag & ShapeFlags.TELEPORT) {
  ;(type as typeof TeleportImpl).process( // 写分号是为了防止压缩之后()当成表达式了
    n1 as TeleportVNode,
    n2 as TeleportVNode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    slotScopeIds,
    optimized,
    internals
  )
}
```

所以我们重点就是看下`TeleportImpl`是什么东东。

## TeleportImpl

```js
export const TeleportImpl = {
    __isTeleport: true,
    process() {
        if (n1 == null) {
            // 创建逻辑
        } else {
            // 更新逻辑
        }
    },
    remove() {
        // 卸载逻辑
    },
    // 移动节点逻辑
    move: moveTeleport,
    // 服务端渲染时 teleport 的特殊处理逻辑
    hydrate: hydrateTeleport
}
```

可以看到`TeleportImpl`就是一个对象，具备**一个属性，四个方法**

- `__isTeleport`：该属性的值固定为 true，会通过暴露一个 `isTeleport`方法，用来判断是不是 `teleport`组件。
- `hydrate` 负责同构渲染过程中的客户端激活。服务端渲染使用，我们暂时不关注。

其他三个方法我们接下来仔细讲讲

### process

`Process` 方法是`Teleport`中最重要的一个方法。负责组件的创建或者更新逻辑。通过`n1`是否为空来判断是挂载还是更新

```js
process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement, // 挂载容器
    anchor: RendererNode | null, // 挂载锚点
    parentComponent: ComponentInternalInstance | null, // 父组件
    parentSuspense: SuspenseBoundary | null,
    isSVG: boolean,
    slotScopeIds: string[] | null,
    optimized: boolean, // 是否开启优化
    internals: RendererInternals
  ) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      o: { insert, querySelector, createText, createComment } // 插入节点、查询选择器、创建文本节点、创建注释节点，从外部传入进来
    } = internals // 传进来的虚拟dom和真实dom操作函数

    const disabled = isTeleportDisabled(n2.props) // teleport是不是被禁用了
    let { shapeFlag, children, dynamicChildren } = n2

    if (n1 == null) { // 挂载
      // 1. 向原有容器插入锚节点。
      const placeholder = (n2.el = __DEV__ // 开发环境会创建注释，代表这里是teleport的内容
        ? createComment('teleport start')
        : createText(''))
      const mainAnchor = (n2.anchor = __DEV__ // container中mainAnchor之前插入
        ? createComment('teleport end')
        : createText(''))
      insert(placeholder, container, anchor) // container.insertBefore(placeholder, anchor || null)
      insert(mainAnchor, container, anchor)
      // 2. 获取目标节点，并创建一个目标节点的锚点节点（空文本元素）
      const target = (n2.target = resolveTarget(n2.props, querySelector)) // 找到目标的挂载dom
      const targetAnchor = (n2.targetAnchor = createText('')) // 目标位置指定的插入位置
      if (target) {
        // 3. 判断目标节点是否有效，有效的话则将锚点插入到目标节点上。后续以这个锚点为参照物
        insert(targetAnchor, target) // 在目标位置插入一个文本节点
        // #2652 we could be teleporting from a non-SVG tree into an SVG tree
        isSVG = isSVG || isTargetSVG(target)
      } else if (__DEV__ && !disabled) {
        warn('Invalid Teleport target on mount:', target, `(${typeof target})`)
      }

      // 接着定义了一个 mount 方法，当要挂载的新节点（n2）是个数组类型的子节点才会进行挂载
      const mount = (container: RendererElement, anchor: RendererNode) => {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren( // 挂载子孩子到指定容器
            children as VNodeArrayChildren,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            slotScopeIds,
            optimized
          )
        }
      }

      // 最后对 disabled 变量进行判断：如果为 true 则挂载在原先的位置，为 false 则挂载到目标位置
      if (disabled) { // 禁用了就挂载到mainAnchor
        mount(container, mainAnchor) // 插入到container的mainAnchor之前
      } else if (target) { // 没禁用就挂载到targetAnchor
        mount(target, targetAnchor) // 插入到target的targetAnchor之前
      }
    } else {
    // 更新逻辑
  },
```

我们可以先看下挂载逻辑。主要逻辑如下：

1. 向原有容器插入锚节点。后续如果`teleport`被禁用都要以这个锚为参照物挂载在他前面

2. 获取目标节点，并创建一个目标节点的锚点节点（空文本元素）

3. 判断目标节点是否有效，有效的话则将锚点插入到目标节点上。后续以这个锚点为参照物

4. 接着定义了一个 mount 方法，当要挂载的新节点（n2）是个数组类型的子节点才会进行挂载。单独定义一个函数是因为我们在`teleport`禁用和没禁用的时候传入的是不同的参数，所以这里封装了一下。

   > 可能会问这里如果不是一个数组咋办嘞，其实`vue`会强制将`teleport`的孩子变成一个数组。从我们上面的编译结果也能看出来。同时注释中也有说明， Teleport 组件的子节点必须是数组类型，且会被强制运用于编译器和虚拟子节点的标准化中。

5. 最后对 disabled 变量进行判断：如果为 true 则挂载在原先的位置，为 false 则挂载到目标位置

```js
process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement, // 挂载容器
    anchor: RendererNode | null, // 挂载锚点
    parentComponent: ComponentInternalInstance | null, // 父组件
    parentSuspense: SuspenseBoundary | null,
    isSVG: boolean,
    slotScopeIds: string[] | null,
    optimized: boolean, // 是否开启优化
    internals: RendererInternals
  ) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      o: { insert, querySelector, createText, createComment }
    } = internals // 传进来的虚拟dom和真实dom操作函数

    const disabled = isTeleportDisabled(n2.props) // teleport是不是被禁用了
    let { shapeFlag, children, dynamicChildren } = n2

    if (n1 == null) {
      // 挂载过程
    } else {
      n2.el = n1.el // 更新内容，不更新dom节点
      const mainAnchor = (n2.anchor = n1.anchor)!
      const target = (n2.target = n1.target)! // 目标节点
      const targetAnchor = (n2.targetAnchor = n1.targetAnchor)! // 目标节点挂载的位置
      const wasDisabled = isTeleportDisabled(n1.props) // 之前是否被禁用
      const currentContainer = wasDisabled ? container : target // 当前挂载的节点
      const currentAnchor = wasDisabled ? mainAnchor : targetAnchor // 当前挂载的锚点
      isSVG = isSVG || isTargetSVG(target)

      // 处理孩子节点
      if (dynamicChildren) { // 快速通道
        patchBlockChildren(
          n1.dynamicChildren!,
          dynamicChildren,
          currentContainer,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds
        )
        traverseStaticChildren(n1, n2, true)
      } else if (!optimized) { // 非快速通道，children进行全量的diff
        patchChildren(
          n1,
          n2,
          currentContainer,
          currentAnchor,
          parentComponent,
          parentSuspense,
          isSVG,
          slotScopeIds,
          false
        )
      }

      if (disabled) {
        if (!wasDisabled) {
          moveTeleport( // 移动到mainAnchor
            n2,
            container,
            mainAnchor,
            internals,
            TeleportMoveTypes.TOGGLE // enabled -> disabled
          )
        } else {
          // 如果to发生改变，需要更新n2.props.to为老的props.to，防止之后teleport变成enabled之后to没更新导致错误渲染
          if (n2.props && n1.props && n2.props.to !== n1.props.to) {
            n2.props.to = n1.props.to
          }
        }
      } else { // 新的没被禁用
        // target changed
        if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) { // to发生改变，不论之前是不是禁用的都需要移动
          const nextTarget = (n2.target = resolveTarget(
            n2.props,
            querySelector
          )) // 获取新的target
          if (nextTarget) { // 如果有新的target就移动到新的target
            moveTeleport(
              n2,
              nextTarget,
              null,
              internals,
              TeleportMoveTypes.TARGET_CHANGE
            )
          } else if (__DEV__) { // 没有就警告
            warn(
              'Invalid Teleport target on update:',
              target,
              `(${typeof target})`
            )
          }
        } else if (wasDisabled) { // 之前是禁用的
          // disabled -> enabled
          // move into teleport target
          moveTeleport( // 需要从contianer移动到target中去
            n2,
            target,
            targetAnchor,
            internals,
            TeleportMoveTypes.TOGGLE
          )
        }
      }
    }

    updateCssVars(n2) // 更新css变量
  },
```

更新过程稍微复杂一点，因为涉及`to`和`disabled`两个属性的变化。`vue`对这这两个属性的变化的几种情况做了分类讨论。

首先我们先进行一些初始化操作：

- 将旧节点中绑定的元素、锚点和目标节点直接赋值给新节点。
- 根据 `disabled` 属性当前判断目标容器和目标锚点
- 当需要更新的节点中存在动态子节点（`dynamicChildren`）的时候，就可以通过`patchBlockChildren`仅对动态子节点部分进行更新（静态节点就不更新）。这里需要注意，走快捷通道的时候我们是不会对静态节点进行操作的。所以为了保证在动态块中的所有静态节点在热更新后依然能维持之前的层级结构，我们通过`traverseStaticChildren`方法做一些处理。
- 当没有`dynamicChildren`时，并且没有开启优化模式（`optimized`）：例如本地开发热更新的时候，可能用户改了静态节点的内容，就使用`patchChildren`走全量的` diff`。

在处理完初始化和子节点的操作之后，我们就要针对`to`和`disabled`两个属性的变化做不通的处理

#### 如果新节点的`disabled`属性为`true`

1. 如果老节点`disabled`为`false`。这时候我们直接调用`moveTeleport`将新节点移动到原始容器上。
2. 如果老节点`disabled`也为`true`。这时候我们只需要注意：如果to发生改变，需要更新n2.props.to为老的props.to，防止之后teleport变成enabled之后to没更新导致错误渲染。不需要做其他的处理

#### 如果新节点的`disabled`属性为`false`

1. 如果新节点的`to`发生了变化，这时候我们啥也不需要管，直接调用`moveTeleport`移动新节点到新的目标节点上就好。但是这里需要判断新节点是否存在
2. 如果老节点`disabled`为`true`。这时候我们直接调用`moveTeleport`将新节点移动到目标上。

### move

`move`方法，也就是`moveTeleport`主要用来执行`teleport`组件的移动操作。例如我们上面更新过程的移动。或者对于渲染器的移动节点方法，`Teleport `也会调用自己的函数进行移动。

```js
const move: MoveFn = (
    vnode,
    container,
    anchor,
    moveType,
    parentSuspense = null
  ) => {
  ...
  if (shapeFlag & ShapeFlags.TELEPORT) {
    ;(type as typeof TeleportImpl).move(vnode, container, anchor, internals)
    return
  }
  ...
}
```

```js
function moveTeleport(
  vnode: VNode,
  container: RendererElement,
  parentAnchor: RendererNode | null,
  { o: { insert }, m: move }: RendererInternals,
  moveType: TeleportMoveTypes = TeleportMoveTypes.REORDER
) {
  // 目标节点（target）有变更，有变更的话将目标节点的锚点（targetAnchor）插入到新的容器位置
  if (moveType === TeleportMoveTypes.TARGET_CHANGE) {
    insert(vnode.targetAnchor!, container, parentAnchor)
  }
  const { el, anchor, shapeFlag, children, props } = vnode
  const isReorder = moveType === TeleportMoveTypes.REORDER
  // 是REORDER类型，是的话将对应元素插入主视图中即可
  if (isReorder) { // 挂载到主容器
    insert(el!, container, parentAnchor)
  }
  // 当移动类型不是REORDER，或者 Teleport 被禁用（disabled 属性设为 true）时，需要移动所有的子节点到 container
  if (!isReorder || isTeleportDisabled(props)) {
    // Teleport has either Array children or no children.
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      for (let i = 0; i < (children as VNode[]).length; i++) {
        move(
          (children as VNode[])[i],
          container,
          parentAnchor,
          MoveType.REORDER
        )
      }
    }
  }
  // 最后再对REORDER类型节点的锚点节点(注释节点)同步插入到主视图（container）中即完成移动
  if (isReorder) {
    insert(anchor!, container, parentAnchor)
  }
}
```

上述就是`teleport`的移动方法，对于不同的`TeleportMoveTypes`类型做不同的处理。`TeleportMoveTypes`的枚举如下：

```typescript
export const enum TeleportMoveTypes {
  TARGET_CHANGE, // to 属性值：目标节点 target 发生改变
  TOGGLE, // disabled 属性值发生改变
  REORDER // 非新增元素的节点重排
}
```

这里的`REORDER`重排类型是指我们`teleport`子节点在`diff`的时候不在最长递增子序列里面的节点，需要移动他进行重排。

### reomve

`Remove`方法负责组件的删除逻辑。移除组件是通过渲染器中的`unmount`方法，其中对于 teleport/keepalive/suspense 等内置组件都会走内置组件自身的卸载逻辑：

```typescript
const unmount: UnmountFn = (
    vnode,
    parentComponent,
    parentSuspense,
    doRemove = false,
    optimized = false
  ) => {
  ...
  if (shapeFlag & ShapeFlags.TELEPORT) {
    ;(vnode.type as typeof TeleportImpl).remove(
      vnode,
      parentComponent,
      parentSuspense,
      optimized,
      internals,
      doRemove
    )
  }
  ...
}
```

`remove`方法的实现如下：

```typescript
remove(
    vnode: VNode,
    parentComponent: ComponentInternalInstance | null,
    parentSuspense: SuspenseBoundary | null,
    optimized: boolean,
    { um: unmount, o: { remove: hostRemove } }: RendererInternals,
    doRemove: boolean
  ) {
    const { shapeFlag, children, anchor, targetAnchor, target, props } = vnode

    if (target) {
      hostRemove(targetAnchor!)
    }

    // an unmounted teleport should always unmount its children whether it's disabled or not
    doRemove && hostRemove(anchor!)
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      const shouldRemove = doRemove || !isTeleportDisabled(props)
      for (let i = 0; i < (children as VNode[]).length; i++) {
        const child = (children as VNode[])[i]
        unmount(
          child,
          parentComponent,
          parentSuspense,
          shouldRemove,
          !!child.dynamicChildren
        )
      }
    }
  }
```

如果存在目标节点。首先会将目标节点 `target `挂载的锚点节点` targetAnchor` 移除。接着会去移除 Teleport 的锚点节点 `anchor `(即`process`中生成的注释节点)，并调用`unmount`方法递归的将 `Teleport` 的子节点全部删除。

## 总结

Teleport是Vue3的一个重要特性，它可以帮助我们更加灵活地控制组件的渲染位置。Teleport的实现原理比较复杂，涉及到Vue的虚拟DOM系统和渲染机制，但是通过深入理解和学习，我们可以更好地理解Vue的工作原理，从而编写出更高效、更优雅的代码。