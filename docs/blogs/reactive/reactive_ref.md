# Reactive & ref

## 创建响应式变量

接下来我们会从源码角度一步步的深入响应式原理。首先我们从创建响应式变量说起，在`vue3`中我们可以通过`ref`和`reactive`函数来创建响应式变量，例如

```js
const flag = ref(false);
const obj = reactive({name: 'xzy'});
```

::: tip
`ref`和`reactive`主要区别在于`reactive`只能传入对象，而`ref`则不限参数类型，它会返回一个对象，将值做为对象中`value`的属性值。其实很好理解，`vue3`的响应式是基于proxy的（TODO）

在实现原理上。`ref`和`reactive`底层实现大致相同，如果`ref`传入的是一个对象，底层其实调用的还是`reactive`。

:::

## reactive

```javascript
// reative
function reactive(target: object) {
  if (isReadonly(target)) { // 只读的直接返回
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  )
}

function createReactiveObject(
  target: Target, // 代理对象
  isReadonly: boolean, // 是不是只读的
  baseHandlers: ProxyHandler<any>, // 基础的handler
  collectionHandlers: ProxyHandler<any>, // 集合类型的handler
  proxyMap: WeakMap<Target, any> // 缓存map
) {
  if (!isObject(target)) { // 只能代理对象
    return target
  }
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE]) // 已经是响应式啦
  ) {
    return target
  }
  const existingProxy = proxyMap.get(target) // 防止重复对同一个对象调用 reactive
  if (existingProxy) {
    return existingProxy
  }
  const targetType = getTargetType(target) // 三种类型，普通（obj / arr），集合类型(set map)，和无效类型
  if (targetType === TargetType.INVALID) {
    return target
  }
  // 主要逻辑，创建响应式对象
  const proxy = new Proxy( // 代理
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers // 不同的类型有不同的handler方法
  )
  proxyMap.set(target, proxy)
  return proxy
}
```

`reactive`(源码位于`packages/reactivity/src/reactive.t`)实现如上，主要逻辑都已经加上了注释。`reactive`内部会调用`new Proxy`创建响应式对象。并将响应式对象存在全局的一个`reactiveMap`中方便后面获取。全局一共有四个`weakMap`，用来存储各种类型的响应式对象。

```typescript
// 缓存当前代理的对象，是一个弱引用。如果key没有被引用将会被删除
export const reactiveMap = new WeakMap<Target, any>()
export const shallowReactiveMap = new WeakMap<Target, any>() // shallow类型
export const readonlyMap = new WeakMap<Target, any>() // readonly类型
export const shallowReadonlyMap = new WeakMap<Target, any>() // shallow&readonly类型
```

`reactive`内部调用了`createReactiveObject`函数，在`createReactiveObject`函数中做了一系列的判断，最后创建了`proxy`代理对象。

这里关注的是我们的代理对象的类型，因为不同的类型有不同的处理函数。在`vue3`中有三种类型，枚举如下:

```typescript
const enum TargetType {
  INVALID = 0, // 不能代理的类型
  COMMON = 1, // Object、Array
  COLLECTION = 2 // 集合类型 Map、Set、WeakMap、WeakSet
}
```

## mutableHandlers

接下来我们看下`mutableHandlers`的实现，（`baseHandlers`就是我们传入的`mutableHandlers`）

`mutableHandlers`的实现在 `packages/reactivity/src/baseHandlers.ts` 中，在 `basehandlers` 中包含了四种 `handler` ：

1. `mutableHandlers` 可变处理。
2. `readonlyHandlers` 只读处理。
3. `shallowReactiveHandlers` 浅观察处理（只观察目标对象的第一层属性）。
4. `shallowReadonlyHandlers` 浅观察 && 只读处理。

其中 `readonlyHandlers` `shallowReactiveHandlers` `shallowReadonlyHandlers` 都是 `mutableHandlers` 的变形版本，这里我们将以 `mutableHandlers` 这个可变的来展开描述。

```js
class MutableReactiveHandler extends BaseReactiveHandler { // 响应式处理，继承至BaseReactiveHandler
  constructor(shallow = false) {
    super(false, shallow)
  }
  set( // 处理变量赋值
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key] // 旧的值
    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) { // 如果oldValue是只读的Ref，但是value（即将设置的值）不是Ref，直接return false。
      return false
    }
    if (!this._shallow) { // 不是浅响应式
      if (!isShallow(value) && !isReadonly(value)) { // 如果value（即将设置的值）不是只读、浅响应的，把oldValue 和 value 都toRaw。
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      // 如果target不是Array，并且oldValue是Ref，value不是Ref，那就直接设置oldValue.value并返回。
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    } else {
    }

    // 判断要设置的key存不存在，数组的话判断key是不是小于数组length的整数，对象就调用hasOwn。
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    if (target === toRaw(receiver)) { // 当target是原型链上的的东西的时候就不会触发更新
      if (!hadKey) { // 没有这个key说明是添加的key的操作，添加add的触发
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) { // 如果有这个key说明是赋值的操作，添加set的操作
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }

  deleteProperty(target: object, key: string | symbol): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) { // 如果有值并且删除成功就触发更新
      trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
  }

  has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key)
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, TrackOpTypes.HAS, key)
    }
    return result
  }
  ownKeys(target: object): (string | symbol)[] {
    track( // 用于拦截 for...in for...of的遍历操作
      target,
      TrackOpTypes.ITERATE, // ITERATE类型
      isArray(target) ? 'length' : ITERATE_KEY
    )
    return Reflect.ownKeys(target)
  }
}
```

在 `mutableHandlers`，主要对`deleteProperty`，`has`，`ownKeys`，`set`进行了拦截。其中`trigger`和`track`函数出现了很多次，这两个函数十分重要，但是我们暂时不用关注，只需要知道`trigger`函数会触发所有依赖这个属性的副作用更新，`track`函数会将当前活跃的副作用添加到当前属性的依赖中去。

#### `deleteProperty`

用于拦截从`target`删除某个属性的操作（`delete target.xxx`），会先检查`target`中是否包含这个`key`，然后获取这个属性的值，接着调用`Reflect.deleteProperty`删除`key`，如果删除成功的话，调用`trigger`触发更新。

#### `has`

用于拦截判断某个`key`是否存在于`target`的操作（`xxx in target`），先调用`Reflect.has`拿到结果，然后判断如果这个`key`不是`Symbol`类型，则调用`track`收集依赖；如果是`Symbol`类型，那就判断这个`key`在不在`builtInSymbols`中，不在也调用`track`收集依赖。

#### `ownKeys`

用于拦截遍历的操作（`for in、for of...`），先调用`track`收集依赖，然后调用`Reflect.ownKeys`返回结果。

#### `set`

1. 先获取到当前值`oldValue`
2. 如果`oldValue`是只读的`Ref`，但是`value`（即将设置的值）不是`Ref`，直接`return false`。
3. 如果`shallow`为`false`

- 如果`value`（即将设置的值）不是只读、浅响应的，把`oldValue` 和 `value` 都`toRaw`。
- 如果`target`不是`Array`，并且`oldValue`是`Ref`，`value`不是`Ref`，那就直接设置`oldValue.value`并返回。

1. 判断要设置的`key`存不存在，数组的话判断`key`是不是小于数组`length`的整数，对象就调用`hasOwn`。
2. 调用`Reflect.set(target, key, value, receiver)`设置`value`。
3. 如果`target`是原型链上的东西，不触发更新。
4. 如果`hadKey`为`false`，代表是`ADD`操作，需要触发更新。
5. 如果`oldValue` 和 `value` 相等，不触发更新。

我们平时更改属性值的时候，一般都是触发`set`的`handler`执行，在执行过程中调用`trigger`函数进行副作用的调用。这里我们少了一个获取值的`handler`，它位于`BaseReactiveHandler`，`mutableHandlers`通过继承获取`BaseReactiveHandler`的`get`函数。

## BaseReactiveHandler

```js
class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(
    protected readonly _isReadonly = false, // 是不是只读的
    protected readonly _shallow = false // 是不是浅响应式
  ) {}

  get(target: Target, key: string | symbol, receiver: object) {
    const isReadonly = this._isReadonly,
      shallow = this._shallow
    if (key === ReactiveFlags.IS_REACTIVE) { // 是不是深度响应式。调用isReactive
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) { // 是不是只读。调用isReadonly
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) { // 判断是不是浅响应式
      return shallow
    } else if ( // 调用toRaw获取原始对象
      key === ReactiveFlags.RAW &&
      receiver ===
        (isReadonly
          ? shallow
            ? shallowReadonlyMap
            : readonlyMap
          : shallow
          ? shallowReactiveMap
          : reactiveMap
        ).get(target) // 如果从全局的响应式map中存在target，说明被代理过，可以返回原始对象
    ) {
      return target
    }

    const targetIsArray = isArray(target) // 判断是不是数组，数组需要重写

    if (!isReadonly) {
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver) // 重新数组的方法
      }
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
    }

    const res = Reflect.get(target, key, receiver) // 获取返回的结果

    // 如果key是Symbol类型并且这个key包含在builtInSymbols中，直接返回res。
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key) // 不是只读的就收集依赖
    }

    if (shallow) { // 浅响应式就直接返回了
      return res
    }

    if (isRef(res)) { // 如果res是Ref并且target是Array并且key是整数，返回res，否则返回res.value。
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res) // 如果是对象，就需要循环的去处理,保证深响应式
    }

    return res
  }
}
```

`get`

1. 针对特殊的`key`返回对应的值
2. `target`是不是`Array`，如果是的话，判断`key`是不是`['push', 'pop', 'shift', 'unshift', 'splice','includes', 'indexOf', 'lastIndexOf']`中的一个，如果是的话就返回`arrayInstrumentations`中对应重写过后的方法。
3. 调用`Reflect.get(target, key, receiver)`获取本次`get`的结果`res`。
4. 接着，如果不是只读的，进行`track`，收集依赖。
5. 如果`res`是对象，那么就接着进行响应式处理，并返回代理对象，根据`isReadonly`的值调用`readonly/reactive`。可以看到嵌套对象的响应式是在`get`才会响应式处理，懒响应式，相比`Vue2`的递归`getter/setter`好多了。

上述说到我们的数组上的特殊属性和方法会用`arrayInstrumentations`重写，下面看下`arrayInstrumentations`方法

## arrayInstrumentations

```javascript
function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  (['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) { // 遍历的收集每一项依赖
        track(arr, TrackOpTypes.GET, i + '')
      }
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        return arr[key](...args.map(toRaw)) // 为什么要把参数调用toRaw得到原始对象后再找一次，就是为了防止原始对象和其代理对象比较这种情况。
      } else {
        return res // 找到了直接返回
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => { // 这些会修改length，如果有两个修改lenth的操作就会死循环
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking() // 暂停依赖
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetTracking() // 重新开始收集依赖
      return res
    }
  })
  return instrumentations
}
```

可以看到对于**`includes, indexOf, lastIndexOf`**每一个函数都做了以下几件事

1. 遍历数组每一项，调用`track`收集依赖
2. 先用传进来的值去查找，如果没有找到的话就用`toRow`之后的值再去比较一次。主要是为了防止原始值和代理对象做比较的情况

```javascript
const obj = {}
const proxy = reactive([obj])
console.log(proxy.indexOf(proxy[0])); // -1
console.log(proxy.indexOf(obj)); // 0
```

如果我们注释掉重写逻辑，访问`proxy[0])`将会是-1，因为我们代码中是用`const arr = toRaw(this)`去寻找的，`proxy[0])`是一个代理对象，当然找不到，所以为了防止这种情况我们会用参数的原始值再找一次。

对于**`push, pop, shift, unshift, splice`** 同样的，每一个函数都做了以下几件事：

1. 暂停`track`。
2. 调用数组API得到结果。
3. 恢复`track`。
4. 返回结果。

我们注意到这些方法都会改变数组的长度，重写这些方法主要是为了防止死循环，具体issues(#2137)。

```js
const arr = []
const proxyArr = reactive(arr)
watchEffect(() => {
  proxyArr.push('r')
})
watchEffect(() => {
  proxyArr.push('i')
})
```

例如上面的例子中，我们有两个副作用函数，他们在`push`的时候都会触发length`的`get`。所以会导致这两个副作用函数无限执行。因此`vue`重写了这些方法，在访问的时候进行了`pauseTracking`（现在只需要知道是暂停依赖收集的操作，后续会细讲）暂停依赖收集的操作，等访问完了再回复。

## ref

```js
export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(
    value: T,
    public readonly __v_isShallow: boolean
  ) {
    this._rawValue = __v_isShallow ? value : toRaw(value)
    this._value = __v_isShallow ? value : toReactive(value) // 不是浅响应式的就调用reactive搞一把
  }

  get value() {
    trackRefValue(this) // 直接.value百分百响应式
    return this._value
  }

  set value(newVal) {
    const useDirectValue =
      this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) { // 新旧值不一样就触发下
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal) // 每次set也会进行深度响应
      triggerRefValue(this, newVal)
    }
  }
}
```

`ref`函数的实现比较简单
