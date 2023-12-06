# track & trigger

前面讲`reactive`和`ref`的时候我们提到了在`reactive`中访问对应的属性的时候我们会触发`trigger`和`track`，在`ref`中访问`value`会触发`trackRefValue`和`triggerRefValue`。这几个函数是我们收集和触发依赖的关键函数，接下来我们会详细的讲解这几个函数。

首先我们需要了解几个概念

1. `shouldTrack`：这是一个全局变量，表示当前是否需要进行响应式的收集，只有为`ture`的时候才会进行依赖收集。例如我们之前了解到的`pauseTracking`和`enableTracking`函数就是改的这个变量

```js
// 暂停收集依赖
export function pauseTracking() {
  trackStack.push(shouldTrack) // 依赖可以嵌套，所以需要保存上一个副作用函数的状态
  shouldTrack = false
}
// 允许收集依赖
export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}
```

2. `activeEffect`: 这是一个全局变量，表示当前活跃的副作用函数。（在程序运行期间，最多只会有一个副作用函数被处理，这个在后面讲解副作用的时候会讲到，他们是通过链表的方式存储的）。
3. `dep`: 一个`Set`对象，用来存储当前变量收集到的所有副作用函数。

```js
// dep的类型定义
export type Dep = Set<ReactiveEffect> & TrackedMarkers
type TrackedMarkers = {
  w: number
  n: number
}

// 创建一个dep
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  dep.w = 0 // 已经被收集的依赖
  dep.n = 0 // 新收集的依赖
  return dep
}
```

可以看到，`dep`就是一个`set`对象，里面存储所有的副作用函数`ReactiveEffect`。我们注意到`dep`还有两外两个属性`n,m`，这两个属性主要是用来做优化的。因为我们程序在运行中副作用函数会触发很多次，如果每次都重新收集所有依赖是很费性能的。这个后面会讲到。

4. `targetMap`：用来存储响应式对象的`map`，`key是每一个target`，`value`是一个`Map`存储的是`target`中被依赖到了的属性的`dep`。

## trackRefValue

```js
export function trackRefValue(ref: RefBase<any>) { // 收集ref的依赖
  if (shouldTrack && activeEffect) { // 需要收集并且有副作用
    ref = toRaw(ref) // 拿到原始值
    trackEffects(ref.dep || (ref.dep = createDep())) // 当前ref没有初始化dep就初始化一个
  }
}
```

上述是`trackRefValue`的主要逻辑，`trackRefValue`和``track`都会调用`trackEffects`进行最后的依赖收集，所以我们后面再讲`trackEffects`这个函数。

## triggerRefValue

```js
export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  ref = toRaw(ref)
  const dep = ref.dep
  if (dep) {
     triggerEffects(dep) // 触发ref的依赖
  }
}
```

上述是`trackRefValue`的主要逻辑，获取到所有副作用的`dep`，然后调用`triggerEffects`触发这些副作用，同理`triggerEffects`我们后面会讲。

## track

```javascript
/**
 * @param target - // 响应式对象
 * @param type - // 访问类型
 * @param key - // 响应式属性的key
 */
export function track(target: object, type: TrackOpTypes, key: unknown) { // 收集依赖
  if (shouldTrack && activeEffect) { // 当前是不是需要收集依赖
    let depsMap = targetMap.get(target) // 获取当前target的map
    if (!depsMap) { // 不存在就创建一个
      targetMap.set(target, (depsMap = new Map())) // 为每一个响应式对象设置一个map存储
    }
    let dep = depsMap.get(key) // 获取当前key的依赖
    if (!dep) { // 不存在就创建一个
      depsMap.set(key, (dep = createDep())) // 每一个Key都有单独的dep存放副作用
    }

    const eventInfo = __DEV__ // 本地调试用
      ? { effect: activeEffect, target, type, key }
      : undefined

    trackEffects(dep, eventInfo) // 为当前的key添加effect依赖
  }
}
```

`track`的逻辑也比较简单，主要逻辑是在确定`dep`参数，确定了以后再调用`trackEffects`。另外有一个`TrackOpTypes`，代表的是触发`track`的类型。枚举如下：

```js
export const enum TrackOpTypes {
  GET = 'get', // target.key
  HAS = 'has', // key in target
  ITERATE = 'iterate' // 遍历
}
```

## trigger

```js
export function trigger(
  target: object,  // 响应式对象
  type: TriggerOpTypes, // 类型
  key?: unknown, // 响应式属性的key
  newValue?: unknown, // 新的值
  oldValue?: unknown, // 旧的值
  oldTarget?: Map<unknown, unknown> | Set<unknown> // 旧的target
) {
  const depsMap = targetMap.get(target) // 从targetMap获取当前target的Map
  if (!depsMap) { // 从来没有被收集过，直接返回
    return
  }

  let deps: (Dep | undefined)[] = [] // 需要更新的依赖，用一个数组存起来
  // 1. CLEAR处理
  if (type === TriggerOpTypes.CLEAR) { // 如果操作类型为删除，需要通知这个对象所有的依赖
    deps = [...depsMap.values()]
  } else if (key === 'length' && isArray(target)) {  // 2. 数组length处理
    // 如果key是length，并且target是Array
    // 只需要 trigger length对应的dep 和 索引大于等于 newlength对应的dep
    // const arr = reactive([1,2,3,4])，在template中使用到了arr
    // 当执行 arr.length = 3 就会走到这里，deps就会有两项
    // 一个是length对应的dep，一个是索引3对应的dep
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || (!isSymbol(key) && key >= newLength)) {
        deps.push(dep)
      }
    })
  } else { // 3. SET | ADD | DELETE处理
    // 处理 SET | ADD | DELETE 这三种 TriggerOpTypes
    // schedule runs for SET | ADD | DELETE
    // key 不为 undefined，从 depsMap 获取一下这个 key 对应的 dep，并添加到deps
    if (key !== void 0) {
      deps.push(depsMap.get(key))
    }

    // 处理 ADD | DELETE | SET 
    switch (type) {
      case TriggerOpTypes.ADD: // ADD类型
        if (!isArray(target)) { // 不是数组类型就加上迭代key的依赖
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY)) // 如果target 是 Map，还要将 key 为 MAP_KEY_ITERATE_KEY 的 dep 放进去。
          }
        } else if (isIntegerKey(key)) { // 当key是正整数，数组中索引增加了，那就直接trigger length 的 dep
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY)) // 如果target 是 Map，还要将 key 为 MAP_KEY_ITERATE_KEY 的 dep 放进去。
          }
        }
        break
      case TriggerOpTypes.SET: // set操作永远不会改变map的keys函数返回，所以肯定不用添加MAP_KEY_ITERATE_KEY
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  // 只有一个依赖项
  if (deps.length === 1) {
      triggerEffects(deps[0])
    }
  } else {
    const effects: ReactiveEffect[] = []
    for (const dep of deps) {
      if (dep) { // 过滤掉空的deps
        effects.push(...dep)
      }
    }
    triggerEffects(createDep(effects))
  }
}
```

当我们更改了`target`中的属性，可能是新增、删除、清空等，就会触发trigger。`TriggerOpTypes`枚举如下。

```js
export const enum TriggerOpTypes {
  SET = 'set', // 更新
  ADD = 'add', // 添加
  DELETE = 'delete', // 删除
  CLEAR = 'clear' // 清空
}
```

从`trigger`的逻辑不难看出来，它和`track`很像，大部分的逻辑都是在确定`dep`，与`track`不同的是，`trigger`时`dep`可能有多个，确定了`deps`再调用`triggerEffects`。源码中我们已经添加了很多注释，接下来我们逐个分析下各种类型

1. `TriggerOpTypes.CLEAR`

如果是`Map|Set`的`clear`操作，`depsMap`中的所有`dep`都需要去`trigger`，这个很好理解，对象被清空了，所以任何用到对象中任何一项的`dep`都需要被`trigger`。

2. `TriggerOpTypes.ADD`

对于数组类型，当`key`是正整数，数组中索引增加了，那就直接`trigger` `length` 的 `dep`。对于非数组，将 `key` 为 `ITERATE_KEY` 的 `dep` 放进去（不管有没有），因为最后会把 `undefined` 的过滤掉；如果`target` 是 `Map`，还要将 `key` 为 `MAP_KEY_ITERATE_KEY` 的 `dep` 放进去。其实很好理解，我们新增了值肯定会影响`Map/Set/Object`的遍历。所以需要将`ITERATE_KEY`加进去

3. `TriggerOpTypes.SET`

有两种情况会走到这里，一种是 `obj.xxx = 'newValue'`，这种情况在一开始已经处理了——`deps.push(depsMap.get(key))`; 另一种是 `Map` 的 `set`（`Set` 没有 `set` 操作），`Map` 的 `set` 操作影响的是 `map对象` 除了 `keys()` 之外的遍历操作（`value、entries、forEach、Symbol.iterator`），因此只需要`trigger` `key` 为 `ITERATE_KEY` 的 `dep`。这也是为什么需要将`Map`的`key`单独用一个变量表示。

4. ``TriggerOpTypes.DELETE`

处理`DELETE`操作时，可能是`Map|WeakMap|Set|WeakSet`的`delete`，也可能是删除`Object`的属性，但是不论是任何一种，都会影响对象的遍历结果，因此需要`trigger` `key` 为 `ITERATE_KEY` 或 `MAP_KEY_ITERATE_KEY` 的 `dep`。与处理`ADD`操作的非数组逻辑一致。

处理完上述逻辑后我们就获取到了最终需要触发的`deps`，我们最后会调用`triggerEffects`去触发副作用。

## trackEffects

```js
export function trackEffects(
  dep: Dep, // 对应属性所存储的副作用set
  debuggerEventExtraInfo?: DebuggerEventExtraInfo // 开发环境给onTrack的信息
) {
  let shouldTrack = false
  if (effectTrackDepth <= maxMarkerBits) {
    // 是否已经被新收集
    if (!newTracked(dep)) {
      // 当前依赖打上新增标识
      dep.n |= trackOpBit // set newly tracked 判断这个dep对于当前的副作用来说是新的，可以添加上去
      // 判断是否还需要收集,因为之前可能已经收集过
      shouldTrack = !wasTracked(dep)
    }
  } else {
    // Full cleanup mode.
    shouldTrack = !dep.has(activeEffect!) // 判断是否还需要收集,因为之前可能已经收集过
  }

  if (shouldTrack) {
    dep.add(activeEffect!) // 添加副作用，也就是添加观察者
    // 给副作用也添加上这个dep，表示副作用函数依赖这个响应式数据。这里就实现了观察者和被观察者相互引用的状态，
    // 是一个多对多的情况。这里主要是用来后续依赖更新的时候做优化用的
    // 同时可以保证相互查找很容易，我们可以立马知道一个数据有哪些副作用依赖它，也很容易知道一个副作用依赖哪些数据
    activeEffect!.deps.push(dep)
    if (__DEV__ && activeEffect!.onTrack) {// 开发环境调用这个看到更新信息
      activeEffect!.onTrack(
        extend(
          {
            effect: activeEffect!
          },
          debuggerEventExtraInfo!
        )
      )
    }
  }
}
```

`track`和`trackRefValue`最终都会调用`trackEffects`来进行依赖的收集。在`trackEffects`中，我们会判断当前属性是不是已经添加了当前正在活跃的副作用，对于最开始的`if/else`逻辑可以后面学习完`reactEffect`再回过头来看，我们现在只需要知道这里和依赖收集的优化相关。

最终如果我们需要为将副作用添加到当前属性，就调用`add`添加。同时也会在副作用的`deps`上添加上这个`dep`。主要是为了方便互相索引，我们后续依赖收集的优化也会用到。

## triggerEffects

```js
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) { 
  // 先触发 computed的副作用，先执行computed的副作用函数
  // 因为其他的副作用函数可能依赖computed的value
    if (effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
  // 触发其它副作用
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
}

function triggerEffect(
  effect: ReactiveEffect,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  if (effect !== activeEffect || effect.allowRecurse) { // 如果激活对象是当前对象，除非允许递归，否则不触发
    if (effect.scheduler) { // 会重新执行依赖收集了
      effect.scheduler()
    } else {
      effect.run() // // 直接调用run
    }
  }
}
```

`triggerEffect`函数也比较简单，就是去遍历每一个`effect`并执行。不过调用的方式有所不同，如果有调度器，就会通过调度器来调用，没有就直接调用。这里副作用的调用也会在后续`reactiveEffect`中讲到，现在只需要知道`effect.run()`会触发副作用。

## 小结

## 参考文献

https://juejin.cn/post/7252283213187432505