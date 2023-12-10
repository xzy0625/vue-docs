Vue3 为了运行时的性能优化，在编译阶段也是下了不少功夫，在接下来的系列文章中，我们一起去了解 Vue 3 编译过程以及背后的优化思想。由于编译过程平时开发中很难接触到，所以不需要你对每一个细节都了解，你只要对整体有一个理解和掌握即可。

## 前置知识

## mode

在进行 `parseChildren`解析时，会时常用到一个变量 `mode`。这个`mode`是什么了？

```text
export const enum TextModes {
  //          | Elements | Entities | End sign              | Inside of
  DATA, //    | ✔        | ✔        | End tags of ancestors |
  RCDATA, //  | ✘        | ✔        | End tag of the parent | <textarea>
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE
}
```

上面是`mode`的枚举。表示当前解析的模式，在不同模式下，解析可能会稍有不同，但是不会影响整体的流程，可以简单了解一下有那些 `mode`。

- DATA（mode = 0 ）：类型即为元素（包括组件）；
- RCDATA（mode = 1 ）：是在`<textarea>`标签中的文本；
- RAWTEXT（mode = 2 ）：类型为`script、noscript、iframe、style`中的代码；
- CDATA（mode = 3 ）：前端比较少接触的`'<![CDATA[cdata]]>'`代码，这是使用于`XML与XHTML中的注释`，在该注释中的 cdata 代码将不会被解析器解析，而会当做普通文本处理;

## ancestors

`ancestors 是一个数组`，用于存储祖先节点数组。 例如我有一个这样的简单模板：

```html
<div>
  <ul>
    <li>1</li>
  </ul>
</div>
```

那么`ancestors`变化如下

```js
[div] -> [div, ul] -> [div, ul, li] -> [div, ul] -> [div] -> []
```

**其实 HTML 的嵌套结构的解析过程，就是一个递归解析元素节点的过程，为了维护父子关系，当需要解析子节点时，我们就把当前节点入栈，子节点解析完毕后，我们就把当前节点出栈，因此 ancestors 的设计就是一个栈的数据结构，整个过程是一个不断入栈和出栈的过程。**

## node节点类型

```typescript
/**
 * VNODE_CALL：虚拟节点调用节点
JS_CALL_EXPRESSION：JS 调用表达式节点
JS_OBJECT_EXPRESSION：JS 对象表达式节点
JS_PROPERTY：JS 对象属性节点
JS_ARRAY_EXPRESSION：JS 数组表达式节点
JS_FUNCTION_EXPRESSION：JS 函数表达式节点
JS_CONDITIONAL_EXPRESSION：JS 条件表达式节点
JS_CACHE_EXPRESSION：JS 缓存表达式节点
 */
export const enum NodeTypes { // 节点类型
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT, // 注释
  SIMPLE_EXPRESSION, // 简单表达式节点
  INTERPOLATION,  // 插值节点
  ATTRIBUTE, // 属性
  DIRECTIVE, // 指令
  // containers
  COMPOUND_EXPRESSION,
  IF, // v-if 指令节点
  IF_BRANCH,
  FOR,
  TEXT_CALL, // 文本调用节点
  // codegenx相关
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT
}
```

## 报错

在`parse`语法解析的过程中如果遇到了语法错误，会通过`emitError`这个函数来抛出错误信息，我们可以在整个流程中可以发现所有的错误都是他来处理的，通过传入不同的错误枚举来处理不同的错误

```typescript
function emitError(
  context: ParserContext,
  code: ErrorCodes, // 错误代码
  offset?: number,
  loc: Position = getCursor(context)
): void {
  if (offset) {
    loc.offset += offset
    loc.column += offset
  }
  context.options.onError( // 处理报错信息
    createCompilerError(code, {
      start: loc,
      end: loc,
      source: ''
    })
  )
}
```

