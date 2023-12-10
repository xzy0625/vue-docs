# parseComment

```js
if (startsWith(s, '<!--')) {
	node = parseComment(context) // 解析注释。
} 
```

对注释的解析，它会解析模板中的注释节点，比如 `<!-- 这是一段注释 -->`， 即当前代码是以 `<!-- 开头的字符串`，则走到注释节点的解析处理逻辑。

```typescript
function parseComment(context: ParserContext): CommentNode {

  const start = getCursor(context)
  let content: string

  // 利用注释结束符的正则表达式去匹配代码，找出注释结束符。如果没有匹配到或者注释结束符不合法，会报错。
  const match = /--(\!)?>/.exec(context.source)
  if (!match) { // 没有匹配到结束字符
    content = context.source.slice(4) // 去掉 <!-- 四个字符
    advanceBy(context, context.source.length)
    emitError(context, ErrorCodes.EOF_IN_COMMENT) // 移动
  } else {
    if (match.index <= 3) { // 空的注释
      emitError(context, ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT)
    }
    if (match[1]) { // 没正确关闭的注释
      emitError(context, ErrorCodes.INCORRECTLY_CLOSED_COMMENT)
    }
    content = context.source.slice(4, match.index) // 如果找到合法的注释结束符，则获取它中间的注释内容 content，然后截取注释开头到结尾之间的代码。

    // Advancing with reporting nested comments.
    const s = context.source.slice(0, match.index)
    let prevIndex = 1,
      nestedIndex = 0
    while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) { // 判断第二步截取到代码是否有嵌套注释，如果有嵌套注释也会报错。
      advanceBy(context, nestedIndex - prevIndex + 1)
      if (nestedIndex + 4 < s.length) {
        emitError(context, ErrorCodes.NESTED_COMMENT)
      }
      prevIndex = nestedIndex + 1
    }
    advanceBy(context, match.index + match[0].length - prevIndex + 1) // 移动指针
  }

  return {
    type: NodeTypes.COMMENT, // 注释节点
    content,
    loc: getSelection(context, start)
  }
}
```

`parseComment`实现也比较简单，主要是通过正则表达式获取到注释的内容，并且需要判断注释是否正确的闭合，是否有嵌套的注释等等。

```html
<!--{{ currentBranch }}-->
```

对于上面的注释最后返回的内容为

```json
{
    "type": 3,
    "content": "{{ currentBranch }}",
    "loc": {
        "start": {
            "column": 1,
            "line": 1,
            "offset": 0
        },
        "end": {
            "column": 27,
            "line": 1,
            "offset": 26
        },
        "source": "<!--{{ currentBranch }}-->"
    }
}
```

