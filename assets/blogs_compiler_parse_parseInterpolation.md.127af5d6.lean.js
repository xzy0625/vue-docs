import{_ as o,o as p,c as t,k as n,a as s,t as e,U as a}from"./chunks/framework.df9742f3.js";const g=JSON.parse('{"title":"parseInterpolation","description":"","frontmatter":{},"headers":[],"relativePath":"blogs/compiler/parse/parseInterpolation.md","filePath":"blogs/compiler/parse/parseInterpolation.md","lastUpdated":1702202902000}'),c={name:"blogs/compiler/parse/parseInterpolation.md"},r=a("",2),F=n("code",null,"parseChildren",-1),y=n("code",null,"当前模板(注意是当前模板)",-1),D=n("code",null,"v-pre 指令的环境",-1),C=n("code",null,"html",-1),A=n("code",null,"pre",-1),i=n("code",null,"parseInterpolation 函数",-1),u=a("",6);function d(l,f,q,_,E,h){return p(),t("div",null,[r,n("p",null,[s("在"),F,s("中这个分支下会走到我们插值表达式的解析。它会解析模板中的插值比如 "),n("code",null,e(l.msg),1),s("。如果"),y,s("是以双大括号开头的字符串，且不在"),D,s("下（v-pre 会跳过插值的解析，直接展示数据的原始内容，这个"),C,s("的"),A,s("标签表现一致），则会走到插值的解析处理逻辑 "),i,s("。我们也可以自定义插值符号，这也是能正常解析的。但是我们必须手动设置配置项 delimiters: ['[[', ']]'] 。")]),u])}const B=o(c,[["render",d]]);export{g as __pageData,B as default};
