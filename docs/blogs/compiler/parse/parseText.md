# parseText

```js
if (!node) {
	node = parseText(context, mode) // 解析普通文本。没有节点内容就是普通文本
}
```

当没有解析到任何节点内容的时候，就说明这是一个普通的文本内容，我们就会走到普通文本解析的函数。但是需要注意的是，如果我们解析的时候遇到了`<`或者`{{}}`应该怎么办呢，我们接着往下看

```js
function parseText(context: ParserContext, mode: TextModes): TextNode {
  __TEST__ && assert(context.source.length > 0)

  const endTokens =
    mode === TextModes.CDATA ? [']]>'] : ['<', context.options.delimiters[0]]

  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) { // 找到第一个<或者{{，取最小值。这段算法可以学习下，不知道哪个最前面就都遍历
    const index = context.source.indexOf(endTokens[i], 1) // 不是从零开始噢，不然后面 `这是一个{{哈哈哈哈`这种会死循环
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  __TEST__ && assert(endIndex > 0)

  const start = getCursor(context)
  const content = parseTextData(context, endIndex, mode)

  return {
    type: NodeTypes.TEXT, // 文本节点类型
    content,
    loc: getSelection(context, start) // 获取位置信息
  }
}
```

可以看到，我们在解析文本的时候会先判断我们的文本内容里面是不是有`<`或者`{{}}`，有的话找到这两个最先出现的位置，然后截断之后解释我们的文本内容。

```html
这是一个{{ currentBranch }} 哈哈哈哈
```

例如对于这样一个文本节点，最后面解析出来的对象如下

```json
{
    "type": 2, // 文本节点
    "content": "这是一个",
    "loc": {
        "start": {
            "column": 1,
            "line": 1,
            "offset": 0
        },
        "end": {
            "column": 5,
            "line": 1,
            "offset": 4
        },
        "source": "这是一个"
    }
}
```

**但是如果我们的文本节点内容是这样的，不是一个完整的双插花表达式会怎么样呢。**

```html
这是一个{ { currentBranch 哈哈哈哈
```

首先先正常的解析`parseText`，然后发现含有`{ {`，就会截断，第一次会解析到`这是一个`。然后我们的`while`循环还没有结束，会继续走到`parseInterpolation`双插花表达式的解析中去

```js
if (closeIndex === -1) { // 如果没有找到，就报错
    emitError(context, ErrorCodes.X_MISSING_INTERPOLATION_END)
    return undefined
  }
```

而在`parseInterpolation`中如果没有结束标记，会直接返回，所以在外层`while`之后我们会继续走到`parseText`的处理。然后会得到`{ { currentBranch 哈哈哈哈`这个文本节点。

但是这还不是全部，因为最后这段包含`插槽分割开头字符串`的字符最终只会返回一个节点描述，而不是上面描述的是分开的两个。我们在调用`pushNode`的时候会进行文本节点的合并

```typescript
function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  if (node.type === NodeTypes.TEXT) { // 当前节点为文本节点
    const prev = last(nodes)
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    if (
      prev &&
      prev.type === NodeTypes.TEXT && // 看父节点是不是文本节点
      prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content
      prev.loc.end = node.loc.end
      prev.loc.source += node.loc.source
      return
    }
  }

  nodes.push(node)
}
```

这样就完成我们文本节点的解析了，虽然整个过程不是很难，但是需要考虑的条件还是很多的。