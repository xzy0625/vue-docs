# parseTag

在元素的解析过程中，会解析开始标签和结束标签，在这个解析过程中，都会用到标签节点的解析。

```typescript
function parseTag(
  context: ParserContext,
  type: TagType,
  parent: ElementNode | undefined
): ElementNode | undefined {
  __TEST__ && assert(/^<\/?[a-z]/i.test(context.source))
  __TEST__ &&
    assert(
      type === (startsWith(context.source, '</') ? TagType.End : TagType.Start)
    )

  // 1. 匹配标签文本开始的位置。Tag open.
  const start = getCursor(context) // 获取节点位置信息。
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)! // 匹配标签文本结束的位置。这个正则表达式的含义是：匹配以"<"开头，紧接着是可选的"/"，然后是一个或多个字母（不包括空格、制表符、回车符、换行符、"/"和">"），最后以">"结尾的字符串。其中，^表示匹配字符串的开头，</?表示匹配"<"和"/"（可选）这两个字符，([a-z][^\t\r\n\f />]*)表示匹配一个或多个字母（不包括空格、制表符、回车符、换行符、"/"和">"），i表示忽略大小写。
  const tag = match[1] // 标签名字
  const ns = context.options.getNamespace(tag, parent)

  advanceBy(context, match[0].length) // 从标签开始截断
  advanceSpaces(context) // 去掉空格

  // 保存当前的位置状态和源码状态，目的是为了防止使用到 v-pre 时可以重新获取信息
  const cursor = getCursor(context)
  const currentSource = context.source

  // check <pre> tag pre标签
  if (context.options.isPreTag(tag)) {
    context.inPre = true
  }

  // 2. 解析属性 Attributes.
  let props = parseAttributes(context, type) // 解析属性，返回的是一个数组

  // check v-pre
  if (
    type === TagType.Start &&
    !context.inVPre &&
    props.some(p => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')
  ) {
    context.inVPre = true
    // reset context
    extend(context, cursor)
    context.source = currentSource
    // re-parse attrs and filter out v-pre itself
    props = parseAttributes(context, type).filter(p => p.name !== 'v-pre')
  }

  // 3. 解析结束的位置，判断是不是自闭合标签 Tag close. 
  let isSelfClosing = false
  if (context.source.length === 0) {
    emitError(context, ErrorCodes.EOF_IN_TAG)
  } else {
    isSelfClosing = startsWith(context.source, '/>')
    if (type === TagType.End && isSelfClosing) {
      emitError(context, ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS)
    }
    advanceBy(context, isSelfClosing ? 2 : 1)
  }

  if (type === TagType.End) {
    return
  }

  // 2.x deprecation checks  最后判断标签类型，是组件、插槽还是模板。
  if (
    __COMPAT__ &&
    __DEV__ &&
    isCompatEnabled(
      CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE,
      context
    )
  ) { // 处理v-for v-if
    let hasIf = false
    let hasFor = false
    for (let i = 0; i < props.length; i++) {
      const p = props[i]
      if (p.type === NodeTypes.DIRECTIVE) {
        if (p.name === 'if') {
          hasIf = true
        } else if (p.name === 'for') {
          hasFor = true
        }
      }
      if (hasIf && hasFor) { // 同时含有v-for 和 v-if会警告
        warnDeprecation(
          CompilerDeprecationTypes.COMPILER_V_IF_V_FOR_PRECEDENCE,
          context,
          getSelection(context, start)
        )
        break
      }
    }
  }

  let tagType = ElementTypes.ELEMENT // 判断标签类型，是组件，插槽，还是模版
  if (!context.inVPre) {
    if (tag === 'slot') { // 插槽
      tagType = ElementTypes.SLOT
    } else if (tag === 'template') { // 空标签
      if (
        props.some(
          p =>
            p.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(p.name)
        )
      ) {
        tagType = ElementTypes.TEMPLATE
      }
    } else if (isComponent(tag, props, context)) { // 组件
      tagType = ElementTypes.COMPONENT
    }
  }

  return {
    type: NodeTypes.ELEMENT, // 元素类型
    ns,
    tag,
    tagType, // 标签类型
    props, // 属性
    isSelfClosing, // 是不是自闭合
    children: [],
    loc: getSelection(context, start),
    codegenNode: undefined // to be created during transform phase
  }
}
```

`parseTag`的解析过程还是比较清晰的。主要做以下事情

1. 获取标签名字`tag`

2. 调用`parseAttributes`解析属性，`parseAttributes`已单独作为一篇文章

3. 判断是不是自闭合标签

4. 判断指令是不是同时存在`v-for,v-if`，有的话就会警告

5. 判断标签类型`tagType`。标签类型枚举如下

   ```typescript
   export const enum ElementTypes {
     ELEMENT, // 元素节点
     COMPONENT, // 组件节点
     SLOT, // 插槽节点
     TEMPLATE // 模版
   }
   ```

## 举个🌰

```html
<div
  ref="ref"
  class="class"
  :class="{ active: isActive }"
  :style="{ color: activeColor, fontSize: fontSize + 'px' }"
  @click="clickItem(item)"
>
	test
</div>
```

例如对于上面这个节点，我们的解析内容为

```json
{
    "type": 1,
    "ns": 0,
    "tag": "div",
    "tagType": 0,
    "props": [],
    "isSelfClosing": false,
    "children": [],
    "loc": {
        "start": {
            "column": 1,
            "line": 1,
            "offset": 0
        },
        "end": {
            "column": 144,
            "line": 1,
            "offset": 143
        },
        "source": "<div ref=\"ref\" class=\"class\" :class=\"{ active: isActive }\" :style=\"{ color: activeColor, fontSize: fontSize + 'px' }\" @click=\"clickItem(item)\">"
    }
}
```

