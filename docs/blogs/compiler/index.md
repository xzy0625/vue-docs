Vue3 为了运行时的性能优化，在编译阶段也是下了不少功夫，在接下来的系列文章中，我们一起去了解 Vue 3 编译过程以及背后的优化思想。由于编译过程平时开发中很难接触到，所以不需要你对每一个细节都了解，你只要对整体有一个理解和掌握即可。

## 前置知识

### mode

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

### ancestors

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

### node节点类型

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



## createParserContext

```typescript
function createParserContext(
  content: string,
  rawOptions: ParserOptions
): ParserContext {
  const options = extend({}, defaultParserOptions)

  let key: keyof ParserOptions
  for (key in rawOptions) {
    options[key] =
      rawOptions[key] === undefined
        ? defaultParserOptions[key]
        : rawOptions[key]
  }
  return {
    options,
    column: 1, // 解析到这一行的哪一列
    line: 1, // 解析到第几行
    offset: 0, // 与column不同，偏移量offset是相对于我们要解析的整个模版字符串的位置。需要注意的是偏移量是从0开始计数，而column和line是从1开始计数；
    originalSource: content,  // 代表整个待解析的模版字符串
    source: content, // 代表尚未解析模版字符串
    inPre: false, // 是不是 pre 标签
    inVPre: false, // 是不是使用了 v-pre 指令
    onWarn: options.onWarn
  }
}
```

上述是`createParserContext`的主要逻辑，会创建一个在`parse`过程中使用的全局上下文对象，这个对象上存储了很多信息，供我们全局使用。`column`，`line`，`offset`这几个字段都是和代码的位置`loc`信息相关，在后面解析的过程中会动态变化。`originalSource`是我们传进来的整个模版字符串。`source`表示我们现在剩下未解析的字符串，他是动态变化的，我们在解析的过程中会频繁调用`advanceBy`函数，这个函数就是用来更新`source`和前面提到的位置信息的。当`source`为空的时候代表我们的模版已经解析完成了。

```typescript
// 每解析完一个标签、文本、注释等节点时，Vue 就会生成对应的 AST 节点，并且会把已经解析完的字符串给截断。
// 对字符串进行截断使用的是 advanceBy(context, numberOfCharacters) 函数，context 是字符串的上下文对象，numberOfCharacters 是要截断的字符数。
function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  const { source } = context
  advancePositionWithMutation(context, source, numberOfCharacters) // 更改column line offset
  context.source = source.slice(numberOfCharacters) // 对剩下的字符串进行一个截断的操作
}
```

## parseChildren

```typescript
function parseChildren( // 将 template 重头开始遍历，根据不同的情况去处理不同类型的节点，然后把生成的 node 添加到 AST nodes 数组中。
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[] // 一个栈表示访问的节点，可以实现父子节点
): TemplateChildNode[] {
  const parent = last(ancestors) // 获取到父节点
  const ns = parent ? parent.ns : Namespaces.HTML
  const nodes: TemplateChildNode[] = [] // 当前解析的所有节点

  while (!isEnd(context, mode, ancestors)) { // 处理完所有的节点
    const s = context.source // 未解析的
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined

    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
        // '{{'
        node = parseInterpolation(context, mode) // 解析双花插值表达式。
      } else if (mode === TextModes.DATA && s[0] === '<') {
        // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
        if (s.length === 1) { // 只有一个< 就报错
          emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 1)
        } else if (s[1] === '!') { // 解析<!类型
          // https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
          if (startsWith(s, '<!--')) {
            node = parseComment(context) // 解析注释。
          } else if (startsWith(s, '<!DOCTYPE')) { // 解析文档声明。
            // Ignore DOCTYPE by a limitation.
            node = parseBogusComment(context)
          } else if (startsWith(s, '<![CDATA[')) {
            if (ns !== Namespaces.HTML) {
              node = parseCDATA(context, ancestors)
            } else {
              emitError(context, ErrorCodes.CDATA_IN_HTML_CONTENT)
              node = parseBogusComment(context)
            }
          } else {
            emitError(context, ErrorCodes.INCORRECTLY_OPENED_COMMENT)
            node = parseBogusComment(context)
          }
        } else if (s[1] === '/') { // 解析闭合标签
          // https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
          if (s.length === 2) { // 闭合标签不完整
            emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 2)
          } else if (s[2] === '>') {
            emitError(context, ErrorCodes.MISSING_END_TAG_NAME, 2) // 没有名字不行
            advanceBy(context, 3)
            continue
          } else if (/[a-z]/i.test(s[2])) { // 有标签
            emitError(context, ErrorCodes.X_INVALID_END_TAG)
            parseTag(context, TagType.End, parent) // 解析标签。
            continue
          } else {
            emitError(
              context,
              ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME,
              2
            )
            node = parseBogusComment(context)
          }
        } else if (/[a-z]/i.test(s[1])) { // 开始标签
          node = parseElement(context, ancestors) // 解析元素节点，它会在内部执行 parseTag()。

          // 2.x <template> with no directive compat
          if (
            __COMPAT__ &&
            isCompatEnabled(
              CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE,
              context
            ) &&
            node &&
            node.tag === 'template' &&
            !node.props.some(
              p =>
                p.type === NodeTypes.DIRECTIVE &&
                isSpecialTemplateDirective(p.name)
            )
          ) {
            __DEV__ &&
              warnDeprecation(
                CompilerDeprecationTypes.COMPILER_NATIVE_TEMPLATE,
                context,
                node.loc
              )
            node = node.children
          }
        } else if (s[1] === '?') {
          emitError(
            context,
            ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME,
            1
          )
          node = parseBogusComment(context)
        } else {
          emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 1)
        }
      }
    }
    if (!node) {
      node = parseText(context, mode) // 解析普通文本。没有节点内容就是普通文本
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }
  }

  // Whitespace handling strategy like v2 去掉空白制表符啥的
  let removedWhitespace = false
  if (mode !== TextModes.RAWTEXT && mode !== TextModes.RCDATA) {
    const shouldCondense = context.options.whitespace !== 'preserve'
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.type === NodeTypes.TEXT) {
        if (!context.inPre) {
          if (!/[^\t\r\n\f ]/.test(node.content)) {
            const prev = nodes[i - 1]
            const next = nodes[i + 1]
            // Remove if:
            // - the whitespace is the first or last node, or:
            // - (condense mode) the whitespace is between twos comments, or:
            // - (condense mode) the whitespace is between comment and element, or:
            // - (condense mode) the whitespace is between two elements AND contains newline
            if (
              !prev ||
              !next ||
              (shouldCondense &&
                ((prev.type === NodeTypes.COMMENT &&
                  next.type === NodeTypes.COMMENT) ||
                  (prev.type === NodeTypes.COMMENT &&
                    next.type === NodeTypes.ELEMENT) ||
                  (prev.type === NodeTypes.ELEMENT &&
                    next.type === NodeTypes.COMMENT) ||
                  (prev.type === NodeTypes.ELEMENT &&
                    next.type === NodeTypes.ELEMENT &&
                    /[\r\n]/.test(node.content))))
            ) {
              removedWhitespace = true
              nodes[i] = null as any // remove的设置为null
            } else {
              // Otherwise, the whitespace is condensed into a single space
              node.content = ' '
            }
          } else if (shouldCondense) {
            // in condense mode, consecutive whitespaces in text are condensed
            // down to a single space.
            node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
          }
        } else {
          node.content = node.content.replace(/\r\n/g, '\n')
        }
      }
      // Remove comment nodes if desired by configuration.
      else if (node.type === NodeTypes.COMMENT && !context.options.comments) { // 如果配置需要，请删除注释节点
        removedWhitespace = true
        nodes[i] = null as any
      }
    }
    if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
      // remove leading newline per html spec
      // https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
      const first = nodes[0]
      if (first && first.type === NodeTypes.TEXT) {
        first.content = first.content.replace(/^\r?\n/, '')
      }
    }
  }

  return removedWhitespace ? nodes.filter(Boolean) : nodes // 去掉不需要展示的组件
}
```

while 的遍历解析是整个解析过程中的重点，但是我们没有必要去了解所有代码判断逻辑，我们只需要了解大致的思路就 ok 了。下面我会将一些重要的解析列举分析。

整个解析的代码看起来非常的复杂，但是不同怕，思路非常简单， `将 template 重头开始遍历，根据不同的情况去处理不同类型的节点，然后把生成的 node 添加到 AST nodes 数组中。`

在解析的过程中，解析上下文 context 的状态也是在不断发生变化的，我们可以通过 context.source 拿到当前解析剩余的代码，然后根据不同的情况走不同的分支处理逻辑。在解析的过程中，可能会遇到各种错误，都会通过 emitError 方法报错。