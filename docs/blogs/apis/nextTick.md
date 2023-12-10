# nextTick

## 基本使用

```vue
<script setup>
import { ref, nextTick } from 'vue'

const count = ref(0)

async function increment() {
  count.value++

  // DOM 还未更新
  console.log(document.getElementById('counter').textContent) // 0

  await nextTick()
  // DOM 此时已经更新
  console.log(document.getElementById('counter').textContent) // 1
}
</script>

<template>
  <button id="counter" @click="increment">{{ count }}</button>
</template>
```

`nextTick`的官方定义为：等待下一次 DOM 更新刷新的工具方法。读懂这句话的意思我们需要明白`vue`的调度器原理，建议先阅读[调度器scheduler](/blogs/utils/scheduler)）

我们知道组件的刷新是放置在普通队列的。代码如下：

```js
const effect = (instance.effect = new ReactiveEffect(
  componentUpdateFn,
  () => queueJob(update), // 这个是scheduler
  instance.scope
))
```

而普通队列的执行是一个微任务，我们的代码又是同步的，所以可想而知，我们直接取`dom`的状态显然是未更新的。所以`vue`为我们提供了`nextTick`，方便我们在下一个循环之前获取到最新的`dom`状态

## 实现

```typescript
export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R
): Promise<Awaited<R>> {
  const p = currentFlushPromise || resolvedPromise // 有currentFlushPromise就用currentFlushPromise，没有就用Promise.resolve()
  return fn ? p.then(this ? fn.bind(this) : fn) : p // 保证执行完flushJobs之后在执行nextTick
}
```

`nextTick`的实现非常简单。就是将我们传进来的函数放在`currentFlushPromise`之后执行。这个`currentFlushPromise`就是执行我们任务队列的`promise`

```typescript
function queueFlush() { // 这个执行的是一个微任务
  //当前没有执行任务且没有任务可执行
  if (!isFlushing && !isFlushPending) {
    // 等待任务执行
    isFlushPending = true
    // 将flushJobs放入微任务队列。不会影响现在同步任务的执行
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

看到这里是不是就恍然大悟了，我们`nextTick`其实就是多套了一个`then`，等任务队列执行的`promise`执行完成了在执行我们需要执行的函数。这样子肯定能取到最新的`dom`状态了。

## 总结

可以看到，理解`nextTick`关键还是在于理解`vue`的调度逻辑。