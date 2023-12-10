# parseInterpolation

```js
if (!context.inVPre && startsWith(s, context.options.delimiters[0])) { // 不是pre 并且以双花插值表达式 {{ 开始
	node = parseInterpolation(context, mode) // 解析双花插值表达式。
}
```

在`parseChildren`中这个分支下会走到我们插值表达式的解析。它会解析模板中的插值比如 {{ msg }} 。如果`当前模板(注意是当前模板)`是以`{{`开头的字符串，且不在`v-pre 指令的环境`下（v-pre 会跳过插值的解析，直接展示数据的原始内容，这个`html`的`pre`标签表现一致），则会走到插值的解析处理逻辑 `parseInterpolation 函数`。我们也可以自定义插值符号，这也是能正常解析的。但是你必须手动设置配置项 delimiters: ['[[', ']]']  。

```

```

