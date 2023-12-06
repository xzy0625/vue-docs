# Set和WeakSet

## 介绍

`Set`是一种叫集合的数据结构。 `Set` 对象允许你存储任何类型的唯一值，无论是原始值或者是对象引用，`Set`对象是值的集合，你可以按照插入的顺序迭代它的元素。 `Set`中的元素只会出现一次，即 `Set` 中的元素是唯一的。

## Set的特点

1. `Set` 默认情况下不包含任何键，所有键都是自己添加进去的。
2. `Set` 的键可以是**任意类型**数据
3. `Set`存储的值是唯一不重复的。

## 基本用法

```js
const set = new Set([1, 2, 1]); // 实例化一个Set
console.log(set) // {1, 2} // 重复的1被过滤掉了
```

## 常见属性和方法

- size: 返回`Set`集合中包含的元素总数
- add(value): 向`Set`中添加一个新的值
- has(value): 判断某个值是否在 `Set` 集合中，在返回 true 否则返回 false
- clear(): 清空`Set`，删除所有元素

遍历`Set`的方法

- keys()：返回`Set`的所有键名，是一个迭代器
- values()：返回`Set`的所有的键值，是一个迭代器
- entries()：返回所有成员的键值对，是一个迭代器
- forEach()：遍历`Set`的所有成员

::: tip
由于set只有键值，没有键名，所以`keys() values()`行为完全一致。`entries()`返回的键值对也是相同的
::: 

## WeakSet

> 定义：`WeakSet` 的出现主要解决弱引用对象存储的场景, 其结构与`Set`类似

与`Set`的区别

- `Set `的键可以是任意类型，`WeakSet `的键只能是对象类型(null除外)
- `WeakSet `键名所指向的对象是弱引用，不计入垃圾回收机制
- `WeakSet` 的属性跟操作方法与 `Set` 一致，不同的是 `WeakSet` 没有遍历方法，因为其成员都是弱引用，弱引用随时都会消失，遍历机制无法保证成员的存在

弱引用的概念在`WeakMap`中已经讲解，`WeakSet`的行为和`WeakMap`完全一致。

## 总结

- 弱引用可以方便`js`执行垃圾回收机制，防止开发者忘记手动解除依赖造成内存泄漏
- `Set、WeakSet`、都是一种集合的数据结构
- `Set `的值可以是任意类型，`WeakSet `的值只能是除了`null`以外的对象类型
- `Set` 有遍历方法，` WeakSet` 属于弱引用不可遍历