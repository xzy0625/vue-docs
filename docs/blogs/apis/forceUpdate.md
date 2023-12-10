# forceUpdate

## 基本使用

`$forceUpdate()`是挂载在实例上的一个函数，可以让我们手动强制重新渲染该组件。鉴于 Vue 的全自动响应性系统，这个功能应该很少会被用到。唯一可能需要它的情况是，你使用高阶响应式 API 显式创建了一个非响应式的组件状态。

```vue
<script setup>
import { ref, forceUpdate } from 'vue'

const count = 0;

async function increment() {
  count++;
  forceUpdate();
}
</script>

<template>
  <button id="counter" @click="increment">{{ count }}</button>
</template>
```

例如上面我们的`count`不是一个响应式对象，但是我们可以调用`forceUpdate`强制重新渲染。

## 实现

```js
$forceUpdate: i => i.f || (i.f = () => queueJob(i.update)),
```

`forceUpdate`非常简单，就是手动的调用`queueJob`将实例的`update`函数放入普通队列中，这样就可以实现渲染了。对调度不了解的建议先阅读[调度器scheduler](/blogs/utils/scheduler)）