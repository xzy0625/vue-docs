# watch

## 基本用法

- 选项式

```js
watch: {
	a: function (val, oldVal) {
	console.log('new: %s, old: %s', val, oldVal)
	},
}
```

- 函数式

```js
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (val, oldVal) => {
    console.log('new: %s, old: %s', val, oldVal)
  }
)

watchEffect(() => console.log(count.value))
```

`vue3`目前式选项式和组合式同时兼容，所以我们也是可以使用选项式的方式来使用`watch`的。这里只大概提一下基本用法，详细用法可以[查看官网](https://cn.vuejs.org/api/reactivity-core.html#watcheffect)

## 选项式实现

前面知道在处理组件的时候我们会调用`applyOptions(instance)`处理选项式使用。在`applyOptions(instance)`里面我们会处理`watch`属性

```js
if (watchOptions) { // 处理watch
  for (const key in watchOptions) {
    createWatcher(watchOptions[key], ctx, publicThis, key)
  }
}
```

`watchOptions`是一个对象，也就是我们编写的`watch`，对`watch`中的每一项我们都会调用`createWatcher`去创建一个侦听器

```typescript
export function createWatcher(
  raw: ComponentWatchOptionItem,
  ctx: Data,
  publicThis: ComponentPublicInstance,
  key: string
) {
  const getter = key.includes('.')
    ? createPathGetter(publicThis, key)
    : () => (publicThis as any)[key]
  if (isString(raw)) {
    const handler = ctx[raw]
    if (isFunction(handler)) {
      watch(getter, handler as WatchCallback)
    } else if (__DEV__) {
      warn(`Invalid watch handler specified by key "${raw}"`, handler)
    }
  } else if (isFunction(raw)) {
    watch(getter, raw.bind(publicThis))
  } else if (isObject(raw)) {
    if (isArray(raw)) {
      raw.forEach(r => createWatcher(r, ctx, publicThis, key))
    } else {
      const handler = isFunction(raw.handler)
        ? raw.handler.bind(publicThis)
        : (ctx[raw.handler] as WatchCallback)
      if (isFunction(handler)) {
        watch(getter, handler, raw)
      } else if (__DEV__) {
        warn(`Invalid watch handler specified by key "${raw.handler}"`, handler)
      }
    }
  } else if (__DEV__) {
    warn(`Invalid watch option: "${key}"`, raw)
  }
}
```

`选项式watch`的键可以是`"a.b.c"`这样的形式也可以是普通的`"a"`形式,它的值可以是字符串,函数,对象,数组。所以这个函数主要是处理不同的键类型，最终都是调用到`watch`函数，也就是我们函数式`watch`。

所以可以看到。对于`选项式watch Api`本质上还是调用的函数式`watch Api`进行实现的。这里只是做了重载,对于不同的配置传递不同的参数给`watch`。所以接下来我们重点分析函数式`watch`的实现。

## watch

```js
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStopHandle {
  return doWatch(source as any, cb, options)
}
```

> 代码位于`packages/runtime-core/src/apiWatch.ts`下

`watch`是一个重载了很多种函数类型的函数，最终调用`doWatch`进行处理。主要参数如下

- `source`: 监听的数据源
- `cb`：数据源改变时调用的回调函数
- `options`： `watch`可选参数

## doWatch

```typescript
function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object, // source可以是多种类型
  cb: WatchCallback | null,
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ
): WatchStopHandle {
  const instance =
    getCurrentScope() === currentInstance?.scope ? currentInstance : null // 这里有作用域的effect
  // const instance = currentInstance
  let getter: () => any
  let forceTrigger = false //强制触发
  let isMultiSource = false // 是否多个数据

  // 1. 确定getter
  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) { // 响应式对象默认是深度响应的
    getter = () => source
    deep = true
  } else if (isArray(source)) { // 数组特殊处理
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) { // reactive的话需要深度监听遍历
          return traverse(s)
        } else if (isFunction(s)) { // 函数的话就包裹try_catch，并且this指向instance。
          return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
        } else {}
      })
  } else if (isFunction(source)) { // 函数类型，如果
    if (cb) { // 有cb就是getter
      // getter with cb
      getter = () =>
        callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
    } else { // 没有就是普通的effect
      // no cb -> simple effect
      getter = () => {
        if (instance && instance.isUnmounted) { // 已经卸载了就不调用
          return
        }
        if (cleanup) { // 调用清理函数
          cleanup()
        }
        return callWithAsyncErrorHandling( // 
          source,
          instance,
          ErrorCodes.WATCH_CALLBACK,
          [onCleanup]
        )
      }
    }
  } else {
    getter = NOOP
  }

  // 2.x array mutation watch compat // 兼容v2数组类型
  if (__COMPAT__ && cb && !deep) {
    const baseGetter = getter
    getter = () => {
      const val = baseGetter()
      if (
        isArray(val) &&
        checkCompatEnabled(DeprecationTypes.WATCH_ARRAY, instance)
      ) {
        traverse(val)
      }
      return val
    }
  }

  // 深度监听
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  /**
   * 例如每次执行前取消上一次的请求
   * watch(async (onCleanup) => {
      const { response, cancel } = doAsyncWork(id.value)
      // `cancel` 会在 `id` 更改时调用
      // 以便取消之前
      // 未完成的请求
      onCleanup(cancel)
      data.value = await response
    })
   */
  let cleanup: () => void
  let onCleanup: OnCleanup = (fn: () => void) => {
    // 停止监听函数
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
    }
  }

  let oldValue: any = isMultiSource
    ? new Array((source as []).length).fill(INITIAL_WATCHER_VALUE)
    : INITIAL_WATCHER_VALUE // 旧值，初始化是空的,如果监听的是数组就会初始化数组。通过isMultiSource判断
  
  // 2. 创建job
  const job: SchedulerJob = () => { // 创建任务，供调度器调用
    if (!effect.active) {
      return
    }
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run() // 获取新数据
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) => hasChanged(v, oldValue[i]))
          : hasChanged(newValue, oldValue)) ||
        (__COMPAT__ &&
          isArray(newValue) &&
          isCompatEnabled(DeprecationTypes.WATCH_ARRAY, instance))
      ) {
        // cleanup before running cb again
        // 再次出发的时候清理掉上一次的结果，第一次是没有cleanup的
        if (cleanup) {
          cleanup()
        }
        callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE
            ? undefined
            : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
            ? []
            : oldValue,
          onCleanup
        ])
        oldValue = newValue
      }
    } else { // 没有cb函数的情况就是watchEffect了，直接run就行
      // watchEffect
      effect.run()
    }
  }

  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb

  // 确定调度器的情况
  let scheduler: EffectScheduler
  if (flush === 'sync') { // 同步执行,直接调用job函数
    scheduler = job as any
  } else if (flush === 'post') { // 后置执行
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
  } else { // 默认前置执行，原因是防止再次更改响应式数据造成多次渲染
    job.pre = true
    if (instance) job.id = instance.uid
    scheduler = () => queueJob(job)
  }

  // 初始化副作用函数
  const effect = new ReactiveEffect(getter, scheduler) // 有scheduler后面触发的时候执行的就是scheduler函数

  // initial run
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else if (flush === 'post') {
    queuePostRenderEffect(
      effect.run.bind(effect),
      instance && instance.suspense
    )
  } else {
    effect.run()
  }

  // 取消监听的函数
  const unwatch = () => {
    effect.stop()
    if (instance && instance.scope) {
      remove(instance.scope.effects!, effect)
    }
  }
  // 返回取消监听的函数
  return unwatch
}
```

可以看到这个函数是非常长的，我们省略了一些无关的代码。主要逻辑为：

1. 不同传入`source`类型的不同做不同的处理，最终确定`getter`函数
2. 确定调度任务`job`和调度函数`schduler`。
3. 根据我们选项传入的`flush`参数不同决定当`source`更改时我们`job`的执行时机。（对任务调度不了解的建议先看[调度器scheduler](/blogs/utils/scheduler)）
4. 调用`ReactiveEffect`创建副作用，并初始化执行`effect.run`。根据我们前面响应式的分析，当前执行`effect.run`时，会执行我们的`getter`函数，从而将我们的副作用添加到对应`getter`中依赖的属性中去。（对响应式不了解的建议先看[响应式原理](/blogs/reactive/)）
5. 返回取消监听的函数

`doWatch`函数逻辑还是非常清楚的，我们一步步来看

### 确定getter函数

`getter`函数在`watch`中还是非常重要的，我们知道`watch`可以传入不同的数据类型，我们需要对这些数据类型做标准化处理，封装成函数类型，因为最终我们需要传递给`ReactiveEffect`的第一个参数`fn`，而`fn`是一个函数。具体流程如下：

1. 如果监听的数据(`source`)是**ref类型**,包装成`getter`形式。

2. 如果监听的数据(`source`)是**reactive类型**,需要设置为**深度监听**。

3. 如果监听的数据(`source`)是**数组**,设置变量`isMultiSource=true`表示当前监听了多个变量。同时对数组中的每一项都做响应的处理

4. 如果监听的数据(`source`)是**函数**

   - 如果有`cb`参数，不需要处理直接将`source`当做`getter`
   - 如果没有cb`参数，那么就将这个函数作为`getter`和`回调函数`cb`。没有`cb`的情况就是使用`watchEffect`的时候。可以看到`watchEffect`是没有回调函数的。

   ```typescript
   export function watchEffect(
     effect: WatchEffect,
     options?: WatchOptionsBase
   ): WatchStopHandle {
     return doWatch(effect, null, options)
   }
   ```

5. 如果监听的数据(`source`)啥也不是，就将`getter`设置为`NOOP`，默认不监听任何数据。

6. 对于含有有`cb`并且有`deep`属性的我们需要进行深度监听

### 确定调度任务 job

当我们的数据发生了变化，我们就需要通过调度器去执行我们这个任务。(没有`cb`或者设置了`immediate = true`)在最开始也会执行。

任务的执行逻辑也很简单。判断有没有`cb`执行不同的逻辑，我们只考虑有`cb`的情况

1. 调用`effect.run`(其实就是执行我们的`getter`函数)获取最新的`value`
2. 然后判断我们这一次的变化是不是需要更新。这里面有个只得注意的地方，只要我们设置了`deep = true`，不管这次数据是不是发生更新我们都会触发回调函数的刷新。这应该是`vue`在这里做了个取舍。还是非常耗费性能的。
3. 如果需要更新就调用`cb`来执行响应的回调函数，并传入我们的新旧值。

注意，我们在代码里面看到了`cleanup`函数，这个函数主要是清理上一次副作用的执行结果。我们以官方例子来看下具体是什么意思

```js
watch(id, async (newId, oldId, onCleanup) => {
  const { response, cancel } = doAsyncWork(newId)
  // 当 `id` 变化时，`cancel` 将被调用，
  // 取消之前的未完成的请求
  onCleanup(cancel)
  data.value = await response
})
```

> `onCleanup`接受一个函数作为参数，这个函数会在传递到`cleanup`函数内被调用。可以在每一次之前回调函数之前处理一些特殊逻辑。

从上面的例子可以看出来，如果`id`变化的非常快，第二次触发的时候还没有执行完，我们就可以在第二次的时候取消掉上一次的请求。

### 通过`flush`确定任务执行时机

当监视的数据发生改变的时候会调用`job任务`,但是`job任务`是什么时候调用的呢，这个就是通过`flush参数`的不同来实现的。

- 当**flush为sync**的时：这时候我们的`schduler`就是`job`，也就是我们`job`里面的代码会同步执行

- 当**flush为post**的时:  会调用`queuePostRenderEffect`将 `job`任务放到后置任务队列，这时候是异步的，而且**会等普通队列任务执行完成之后执行**。因此这时候我们可以获取到最新的`dom`状态。
- 当**flush为pre**的时：会将`job任务`设置为前置任务，如果是通过调用`flushPreFlushCbs`执行，这时候我们的`job`就是同步的。如果是通过`flushJob`执行的，这时候就是异步的。不论是哪种方式执行，我们都没办法获取到最新的`dom`状态。

我们这里默认是作为前置任务执行的，主要是为了防止在回调函数中多次更改数据造成页面多次渲染。

### 创建副作用

确定了`getter和shcduler`之后我们就可以创建副作用函数了。创建完之后我们的副作用和`getter`中的数据还没有建立依赖关系，这时候我们就会先执行`effect.run `为`getter`中的数据收集依赖

### 返回取消监听函数

我们的`watch`会返回一个函数用来取消当前的侦听，可以看到`unwatch`的试下就是调用了`effect.stop()`来停止当前的依赖监听。

## 小结

通过以上我们就大概的知道`watch`是如何工作的了，其实我们的`watch`第一个参数会被封装成`getter`传递给`reactiveEffect`，第二个参数`callBack`会传递给任务`job`当数据真正有变化的时候再去调用。`watch`融合了响应式原理和任务调度，让我们对`vue`的实现有了更深层次的了解

