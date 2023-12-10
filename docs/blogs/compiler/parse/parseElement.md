# parseElement

`parseElement`节点解析是我们所有解析函数里面的重中之重。不仅包括节点内容的解析，还需要包括属性等其他内容的解析。

```js
else if (/[a-z]/i.test(s[1])) { // 开始标签
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
}
```

对于`<`开头的`s`，如果我们后面跟着的是一个消息英文字母，就说明是一个元素节点，我们会调用`parseElement`进行解析。

```typescript
function parseElement(
  context: ParserContext,
  ancestors: ElementNode[]
): ElementNode | undefined {
  __TEST__ && assert(/^<[a-z]/i.test(context.source))

  // 1. Start tag. 解析开始标签
  const wasInPre = context.inPre // 是不是在pre标签中
  const wasInVPre = context.inVPre // 是不是在v-pre标签中
  const parent = last(ancestors) // 获取记录栈最后一个元素，即当前解析元素的父元素。
  const element = parseTag(context, TagType.Start, parent) // 解析开始标签，生成一个标签节点，并前进代码到开始标签后。
  const isPreBoundary = context.inPre && !wasInPre
  const isVPreBoundary = context.inVPre && !wasInVPre

  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) { // 如果是自闭和标签或者void tag，直接返回标签节点。其实自闭和标签和 void tag本质是一个意思，就是不一定需要开闭标记一起出现的标签。
    // #4030 self-closing <pre> tag
    if (isPreBoundary) {
      context.inPre = false
    }
    if (isVPreBoundary) {
      context.inVPre = false
    }
    return element
  }

  // 2. Children. 处理元素的children
  ancestors.push(element) // 处理好的节点放到ancestors数组中
  const mode = context.options.getTextMode(element, parent)
  const children = parseChildren(context, mode, ancestors) // 调用parseChildren处理子节点
  ancestors.pop() // 恢复父亲节点

  // 2.x inline-template compat
  if (__COMPAT__) {
    const inlineTemplateProp = element.props.find(
      p => p.type === NodeTypes.ATTRIBUTE && p.name === 'inline-template'
    ) as AttributeNode
    if (
      inlineTemplateProp &&
      checkCompatEnabled(
        CompilerDeprecationTypes.COMPILER_INLINE_TEMPLATE,
        context,
        inlineTemplateProp.loc
      )
    ) {
      const loc = getSelection(context, element.loc.end)
      inlineTemplateProp.value = {
        type: NodeTypes.TEXT,
        content: loc.source,
        loc
      }
    }
  }

  element.children = children // 给元素children赋值

  // 3 End tag. 最后，解析结束标签，前进代码到结束标签，然后更新标签节点的代码位置。最终返回的值就是一个标签节点 element。
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent) // 处理闭合标签，因为这个元素已经解析完了
  } else {
    emitError(context, ErrorCodes.X_MISSING_END_TAG, 0, element.loc.start)
    if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
      const first = children[0]
      if (first && startsWith(first.loc.source, '<!--')) {
        emitError(context, ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT)
      }
    }
  }

  element.loc = getSelection(context, element.loc.start) // 更新位置信息

  if (isPreBoundary) {
    context.inPre = false
  }
  if (isVPreBoundary) {
    context.inVPre = false
  }
  return element
}
```

`parseElement`代码还是比较长的，主题代码是三部分，在注释中分别标出来了

1. 解析开始标签
2. 解析子节点
3. 解析结束标签

### 解析开始标签

1. 标记是否在`pre 标签`内
2. 标记是否在`v-pre 指令`内
3. 调用`parseTag`获取当前元素。[`parseTag`已单独放置为一篇]('/blogs/compiler/parse/parseTag')
4. 如果是自闭合标签就不用解析子节点了，直接返回就行

### 解析子节点

1. 调用`parseChildren`获取子节点信息
2. 将`children`数组添加到element.children`中

### 解析结束标签

1. 调用`parseTag`解析结束标签
2. 前进代码到结束标签，然后更新标签节点的代码位置。最终返回的值就是一个标签节点 element。

## 小结

**元素的解析结果本质上是一个递归的过程，原因在于开发者书写的模板是一个嵌套的结构。递归解析才能将嵌套关系全部解析完成。通过不断地递归解析，就可以完整地解析整个模板，并且标签类型的 AST 节点会保持对子节点数组的引用，这样就构成了一个树形的数据结构，所以整个解析过程构造出的 AST 节点数组就能很好地映射整个模板的 DOM 结构。这里面递归的关键就是`parseChildren`函数**