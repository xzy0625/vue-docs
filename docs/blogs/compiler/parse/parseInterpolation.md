# parseInterpolation

```js
if (!context.inVPre && startsWith(s, context.options.delimiters[0])) { // 不是pre 并且以双花插值表达式 {{ 开始
	node = parseInterpolation(context, mode) // 解析双花插值表达式。
}
```

在`parseChildren`中这个分支下会走到我们插值表达式的解析。它会解析模板中的插值比如 `{{ msg }} `。如果`当前模板(注意是当前模板)`是以双大括号开头的字符串，且不在`v-pre 指令的环境`下（v-pre 会跳过插值的解析，直接展示数据的原始内容，这个`html`的`pre`标签表现一致），则会走到插值的解析处理逻辑 `parseInterpolation 函数`。我们也可以自定义插值符号，这也是能正常解析的。但是我们必须手动设置配置项 delimiters: ['[[', ']]'] 。

```typescript
function parseInterpolation(
  context: ParserContext,
  mode: TextModes
): InterpolationNode | undefined {
  const [open, close] = context.options.delimiters // 1. 找到当前配置中插值的开始标记和结束标记

  const closeIndex = context.source.indexOf(close, open.length) // 2. 找到插值的结束分隔符的位置
  if (closeIndex === -1) { // 如果没有找到，就报错
    emitError(context, ErrorCodes.X_MISSING_INTERPOLATION_END)
    return undefined
  }

  const start = getCursor(context) // 获取当前插值的位置信息
  advanceBy(context, open.length) // 将代码移动开始分隔符之后
  const innerStart = getCursor(context) // 获取内部插值的开始位置
  const innerEnd = getCursor(context) // 获取内部插值的结束位置
  const rawContentLength = closeIndex - open.length  // 插值元素内容的长度
  const rawContent = context.source.slice(0, rawContentLength) // 插值的原始内容
  const preTrimContent = parseTextData(context, rawContentLength, mode) // 除了普通字符串，parseTextData 内部会处理一些 HTML 实体符号比如 &nbsp 。由于开发者在写插值的内容时，可能会为了美观，写入前后空白字符，所以最终返回的 content 需要执行一下 trim 函数。并且还会记录偏移量，做代码前进的操作。
  const content = preTrimContent.trim() // 去掉空格
  const startOffset = preTrimContent.indexOf(content)
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset)
  }
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset)
  advancePositionWithMutation(innerEnd, rawContent, endOffset)
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION, // type表示是一个插值表达式
    content: { // content表示插值表达式的内容
      type: NodeTypes.SIMPLE_EXPRESSION, // type表示插值表达式的内容是一个简单表达式
      isStatic: false, // 是不是静态节点，插值表达式肯定不是
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: ConstantTypes.NOT_CONSTANT,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start) // 位置信息和原始内容信息
  }
}
```

以上就是我们插值解析的所有代码的，重要的步骤都已经做了注释，主要流程就是获取插值表达式的内容和位置信息，最后包装成一个对返回，这个对象是用来描述插值表达式这个节点信息的。

例如我们有以下节点信息

```html
<div id="demo">{{ currentBranch }}</div>
```

最后解析出来的`ast`如下

```json
{
    "type": 5,
    "content": {
        "type": 4,
        "isStatic": false,
        "constType": 0,
        "content": "currentBranch",
        "loc": {
            "start": {
                "column": 4,
                "line": 1,
                "offset": 3
            },
            "end": {
                "column": 17,
                "line": 1,
                "offset": 16
            },
            "source": "currentBranch"
        }
    },
    "loc": {
        "start": {
            "column": 1,
            "line": 1,
            "offset": 0
        },
        "end": {
            "column": 20,
            "line": 1,
            "offset": 19
        },
        "source": "{{ currentBranch }}"
    }
}
```

