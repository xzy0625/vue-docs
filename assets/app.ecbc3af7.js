import{d,h as l,j as m,Y as g,o as r,c as h,e as f,N as v,u as _,a4 as A,z as b,b as E,l as c,S as P,a5 as s,V as p,a6 as w,a7 as C,a8 as I,a9 as D,aa as R,ab as k,ac as x,ad as O,ae as S,af as T,A as L,ag as V,ah as M,ai as j}from"./chunks/framework.c3e1222b.js";import{t as u}from"./chunks/theme.e8cdfda4.js";const z=["id","host","repo","repoid","category","categoryid","mapping","term","strict","reactionsenabled","emitmetadata","inputposition","theme","lang","loading"],B=d({__name:"Giscus",props:{id:{},host:{},repo:{},repoId:{},category:{},categoryId:{},mapping:{},term:{},theme:{},strict:{},reactionsEnabled:{},emitMetadata:{},inputPosition:{},lang:{},loading:{}},setup(t){const a=l(!1);return m(()=>{a.value=!0,g(()=>import("./chunks/giscus-2a044aea.497f0bd4.js"),[])}),(e,n)=>a.value?(r(),h("giscus-widget",{key:0,id:e.id,host:e.host,repo:e.repo,repoid:e.repoId,category:e.category,categoryid:e.categoryId,mapping:e.mapping,term:e.term,strict:e.strict,reactionsenabled:e.reactionsEnabled,emitmetadata:e.emitMetadata,inputposition:e.inputPosition,theme:e.theme,lang:e.lang,loading:e.loading},null,8,z)):f("",!0)}});const N={class:"comments"},F={__name:"comment",setup(t){const a=v(),{isDark:e}=_(),n=A({repo:"xzy0625/vue-docs",repoId:"R_kgDOKw7SEQ",category:"Q&A",categoryId:"DIC_kwDOKw7SEc4CbR9g",mapping:"title",strict:"0",reactionsEnabled:"1",emitMetadata:"0",inputPosition:"top",lang:"zh-CN",loading:"lazy"}),i=l(!0);return b(()=>a.path,()=>{i.value=!1,P(()=>{i.value=!0})},{immediate:!0}),(U,Y)=>(r(),h("div",N,[i.value?(r(),E(c(B),{key:0,repo:n.repo,"repo-id":n.repoId,category:n.category,"category-id":n.categoryId,mapping:n.mapping,"reactions-enabled":n.reactionsEnabled,"emit-metadata":n.emitMetadata,"input-position":n.inputPosition,theme:c(e)?"dark":"light",lang:n.lang,loading:n.loading},null,8,["repo","repo-id","category","category-id","mapping","reactions-enabled","emit-metadata","input-position","theme","lang","loading"])):f("",!0)]))}};const $={...u,Layout:()=>s(u.Layout,null,{"doc-after":()=>s(F)}),enhanceApp({app:t,router:a,siteData:e}){}};function y(t){if(t.extends){const a=y(t.extends);return{...a,...t,async enhanceApp(e){a.enhanceApp&&await a.enhanceApp(e),t.enhanceApp&&await t.enhanceApp(e)}}}return t}const o=y($),G=d({name:"VitePressApp",setup(){const{site:t}=_();return m(()=>{L(()=>{document.documentElement.lang=t.value.lang,document.documentElement.dir=t.value.dir})}),V(),M(),j(),o.setup&&o.setup(),()=>s(o.Layout)}});async function K(){const t=H(),a=Q();a.provide(C,t);const e=I(t.route);return a.provide(D,e),a.component("Content",R),a.component("ClientOnly",k),Object.defineProperties(a.config.globalProperties,{$frontmatter:{get(){return e.frontmatter.value}},$params:{get(){return e.page.value.params}}}),o.enhanceApp&&await o.enhanceApp({app:a,router:t,siteData:x}),{app:a,router:t,data:e}}function Q(){return O(G)}function H(){let t=p,a;return S(e=>{let n=T(e);return n?(t&&(a=n),(t||a===n)&&(n=n.replace(/\.js$/,".lean.js")),p&&(t=!1),g(()=>import(n),[])):null},o.NotFound)}p&&K().then(({app:t,router:a,data:e})=>{a.go().then(()=>{w(a.route,e.site),t.mount("#app")})});export{K as createApp};
