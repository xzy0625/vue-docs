# 调度器scheduler

可调度性是响应式系统中非常重要的特性，调度器的存在可以帮助我们控制副作用函数的执行时机、次数和方式而不会产生魂混乱

我们使用`vue`的时候经常遇到的一个问题就是为什么我们更新响应式数据后立马从页面获取数据为什么获取到的不是最新值。这其实就和我们页面渲染副作用的执行相关，我们的页面渲染是异步执行的，所以同步的代码执行的是我们异步代码(也就是`render`函数)还没执行。将渲染函数设置为异步执行好处还是很多的，例如最基本的我们改变了某个数据很多次，我们不需要每一次都去执行一次`render`只需要执行最后一次就好了。

在`vue`中，以下任务都需要经过调度器的调度

- watch的`callback`函数，需要在组件更新前调用
  - `watch`在一般情况下，是加入到`Pre`队列(`DOM更新前队列`)等待执行，但在组件更新时，`watch`也是加入队列，但会立即执行并清空`Pre`队列
- 组件`DOM`的更新，需要在响应式数据(`Ref、reactive、data`等)变化之后更新
- 父组件需要先更新，子组件后更新
- `mounted`生命周期，需要在组件挂载之后执行
- `updated`生命周期，需要在组件更新之后执行

这些我们可以先有个大概了解，知道和调度器有关，我们会在之后详细讲解。

## JS执行机制

我们都知道 `JS` 是单线程语言，即指某一时间内只能干一件事，为什么 `JS` 不能是多线程呢？这取决于 `JS`的语言特性，我们 `JS`的定位是脚本语言，想象一下，如果同一时间，一个添加了 `DOM`，一个删除了 `DOM`，那么我们浏览器以哪个为准呢。所以 为了避免这类情况， `JS`被设计成单线程的，之后大概率也不会变。

单线程就意味着同一时间我们只能执行一个任务，所有的任务都需要按顺序执行。那么我们遇到一些耗时较长的任务(例如网络请求)，那么其他的任务就需要一直等待，这对于用户的体验显然非常不好，所以`JS`引入了异步的概念。

我们的任务分成同步任务和异步任务。同步任务会在 `JS`主线程上执行，异步任务会单独放在一个任务队列里面，当同步任务执行完毕并且异步任务有返回结果我们就执行异步任务。

- 同步: 在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务
- 异步: 不进入主线程、而进入"任务队列"（task queue）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行

异步任务又会有宏任务和微任务。这里不做展开，相信大家都已经掌握了。由于我们的调度器就和`JS`执行机制有关系，所以在这里提一嘴。

## 调度队列

`vue`中一共有三种任务队列，前置任务，普通任务，后置任务。前置任务和普通任务共用一个队列，通过`pre`来区分，后置任务单独一个队列。

```typescript
// 装载前置任务和普通任务的队列。
const queue: SchedulerJob[] = []
let activePostFlushCbs: SchedulerJob[] | null = null // 是否正在运行后置任务
```

他们的类型都是`SchedulerJob`，表示每一个作业/任务。我们调度器的作用就是调度这个任务按照合理的逻辑执行不会出现问题。

```typescript
export interface SchedulerJob extends Function {
  id?: number //用于设置当前任务的优先级。越小的值优先级越高。
  pre?: boolean //用于判断是否是前置任务。
  active?: boolean //当前任务是否可以执行。为false在执行阶段跳过执行。
  computed?: boolean // 是不是computed
  /*
   * 这里的递归是指:当前正在执行的任务和需要添加的任务是同一个任务,
   * 如果设置了需要递归(job.allowRecurse=true)那么就允许这个任务进入queue队列中,否则不允许进入。
   * 如果是递归的话，开发者需要保证不能出现死循环
   */
  allowRecurse?: boolean  //是否允许递归。
  ownerInstance?: ComponentInternalInstance
}
```

任务的定义如上，他是一个函数，上面会挂载一些属性，我们重点关注`id`和`pre`这两个属性。

## 入队操作

我们的每个任务队列都会有对应的入队操作，向任务队列中添加新的任务。

### 前置任务/普通任务入队

```typescript
export function queueJob(job: SchedulerJob) {
  // 没有任务或者当前任务不存在在当前任务队列里面(allowRecurse情况单独考虑)
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex // 判断这个job是不是已经存在在queue中，如果允许递归，我们不考虑当前的运行job（因为新的job可能是我们正在运行的job产生的，我们允许递归的话就不考虑正在运行的这个）
    )
  ) {
    // 任务没有id优先级就放在队列最后面
    if (job.id == null) {
      queue.push(job)
    } else {
      // 有的话就通过二分查找找到合适的位置插入
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    // 执行任务
    queueFlush()
  }
```

`queueJob`主要是根据任务的id(优先级)，利用二分法找到需要插入的位置，插入到queue队列当中。最后调用`queueFlush`执行所有任务。`queueFlush`函数我们之后再看。

### 后置任务入队

```typescript
export function queuePostFlushCb(cb: SchedulerJobs) {
  if (!isArray(cb)) {
    if (
      !activePostFlushCbs ||
      !activePostFlushCbs.includes(
        cb,
        cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex
      )
    ) {
      pendingPostFlushCbs.push(cb)
    }
  } else {
    //如果cb是一个数组，那么它就是一个组件生命周期挂钩，只能
    //由作业触发，该作业已在主队列中进行了重复数据消除，因此
    //我们可以跳过这里的重复检查来提高性能
    pendingPostFlushCbs.push(...cb)
  }
  queueFlush()
}
```

后置任务的操作和之前任务一样，入队任务并调用`queueFlush`执行。

## 执行任务

我们入队之后都会调用`queueFlush`进行任务的执行，接下来就看具体是如何实现的。

```typescript


let isFlushing = false // 判断当前是否正在执行任务。
let isFlushPending = false // 判断任务是不是在等待阶段，任务的执行是一个微任务,它将会被放到微任务队列,那么对于渲染主线程来说,当前还没有执行这个微任务,在执行这个微任务之前都属于等待阶段。

function queueFlush() { // 这个执行的是一个微任务
  //当前没有执行任务且没有任务可执行
  if (!isFlushing && !isFlushPending) {
    // 等待任务执行
    isFlushPending = true
    // 将flushJobs放入微任务队列。不会影响现在同步任务的执行
    currentFlushPromise = resolvedPromise.then(flushJobs) // resolvedPromise就是Promise.resolve()
  }
}
```

可以看到当我们没有等待任务和正在执行的任务的时候，我们就将状态扭转为等待状态，并将最终任务执行函数`flushJobs`放入微任务队列中。这里等待的意思是：我们需要等同步任务执行完之后才能执行`flushJobs`。

### flushJobs

```typescript
function flushJobs(seen?: CountMap) {
  isFlushPending = false // isFlushPending置为false
  isFlushing = true // 设置为运行状态
  if (__DEV__) {
    seen = seen || new Map() // 这是一个Map,用于缓存job的执行次数
  }

  //在flush之前对queue排序这样做是为了:
  //1.组件更新是从父组件到子组件(因为父组件总是在子组件之前创建，所以父组件的render副作用将会有更低的优先级）
  //2.如果子组件在父组件更新期间并未挂载,那么可以跳过
  queue.sort(comparator) // comparator逻辑：按照id从小到大执行，id相同就前置任务pre先执行
  
  //监测当前任务是否已经超过了最大递归层数
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP

  try {
    // 先执行前置任务和普通任务
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
      }
    }
  } finally {
    // 执行完所有的任务之后,初始化queue
    // 调用post任务,这些任务调用完成后
    // 可能在执行这些任务的途中还有新的任务加入所以需要继续执行flushJobs
    flushIndex = 0
    queue.length = 0

    // 再执行后置任务
    flushPostFlushCbs(seen)

    isFlushing = false
    currentFlushPromise = null // 重置当前的flushPromise
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen) // 重新执行一次保证没有落掉任务，因为运行postFlushQueue之后可能有新的queue
    }
  }
}
```

`flushJobs`就是我们最终的任务执行函数了。可以看到我们的执行是先执行`queue`也就是前置/普通任务。然后调用`flushPostFlushCbs`执行后置任务。等所有任务执行完之后我们会再调用一次`flushJobs`因为在新的任务执行的阶段可能会产生新的任务，所以要确保执行干净。

### flushPostFlushCbs

```typescript
export function flushPostFlushCbs(seen?: CountMap) {
  if (pendingPostFlushCbs.length) {
    //克隆等待执行的pendingPost并去重
    const deduped = [...new Set(pendingPostFlushCbs)]
    pendingPostFlushCbs.length = 0

    // 当前正在执行后置任务就将任务放在后置任务末尾
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }

    activePostFlushCbs = deduped

    activePostFlushCbs.sort((a, b) => getId(a) - getId(b)) // 通过id排序

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      activePostFlushCbs[postFlushIndex]() // 执行
    }
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}
```

`flushPostFlushCbs`执行后置任务的逻辑也比较清晰。也是排序之后一个个执行。

但是值得注意的是，代码中有一个`activePostFlushCbs`不为空就`return`的逻辑。这里主要是为了保证任务的顺序执行，不至于混乱。想象一下如果是直接通过`flushPostFlushCbs`发起的调用后置任务，那么flushPostFlushCbs里面的代码都是同步的。如果这个时候有正在执行通过`flushJobs`发起的`flushPostFlushCbs`调用（是异步的）。那么就会造成直接调用的比我们`flushJobs`调用的先执行了，可能会出现问题。所以会放置到最后然后返回，等待正常执行。

### flushPreFlushCbs

```typescript
export function flushPreFlushCbs(
  seen?: CountMap,
  i = isFlushing ? flushIndex + 1 : 0 // 如果当前有正在执行的任务，需要跳过
) {
  for (; i < queue.length; i++) {
    const cb = queue[i]
    if (cb && cb.pre) { // 执行前置任务
      queue.splice(i, 1) // 去掉当前任务
      i--
      cb() // 前置任务是同步执行的
    }
  }
}
```

对于前置任务，我们会有一个单独的函数`flushPreFlushCbs`来执行，可以看到调用`flushPreFlushCbs`是同步执行的，不论何时调用`flushPreFlushCbs`，我们都会立马执行完所有的前置任务。这一点和`flushPostFlushCbs`不同。

## 小测试

上述就是`vue`调度器的所有内容了，为了加深大家的理解，我们有下面这个小例子，大家可以看下自己掌握的如何。

```js
function pre1(){
  flushPreFlushCbs()
  console.log('pre1')
}
pre1.id = 1
pre1.pre = true

function pre2(){
  console.log('pre2')
}
pre2.id = 9999
pre2.pre = true

function normal(){
  console.log('normal')
}
normal.id = 1

function post1(){
  queuePostFlushCb(post2)
  flushPostFlushCbs()
  console.log('post1')
}

function post2(){
  console.log('post2')
}

queueJob(pre1)
queueJob(pre2)
queueJob(normal)
queuePostFlushCb(post1)

// 最后输出什么
```

上面这个例子把和调度相关的内容都结合起来了。掌握了这个肯定就对`vue`调度器了如指掌了

### 分析

1. `queueJob(pre1)`将`pre1`入队，并调用`queueFlush`产生一个微任务，微任务为`flushJobs`
2. 继续入队，最后按照优先级排序为`[pre1, normal, pre2, post1]`
3. 执行`flushJobs`，`flushJobs`执行`pre1`
4. `pre1`执行`flushPreFlushCbs`，由于`flushPreFlushCbs`是同步的，所以继续执行`pre2`。打印`pre2`，并删除`pre2`
5. `pre1`继续执行打印`pre1`。执行`normal`，打印`normal`
6. `flushJobs`调用`flushPostFlushCbs`执行后置任务，先执行`post1`，`post1`又执行了`flushPreFlushCbs。会将`post2`入队，由于现在有任务正在执行，所以放到任务队列末尾。
7. 打印`post1`，打印`post2`

最后结果为依次打印：`pre2 pre1 normal post1 post2`

