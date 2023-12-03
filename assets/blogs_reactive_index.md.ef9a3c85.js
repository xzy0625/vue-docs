import{_ as e,o,c as s,U as a}from"./chunks/framework.c3e1222b.js";const c="/vue-docs/assets/image-20231202201830606.f9bfa1be.png",n="/vue-docs/assets/image-20231202203903934.8a7ccd4a.png",h=JSON.parse('{"title":"响应式原理开篇","description":"","frontmatter":{},"headers":[],"relativePath":"blogs/reactive/index.md","filePath":"blogs/reactive/index.md","lastUpdated":1701618162000}'),t={name:"blogs/reactive/index.md"},l=a('<h1 id="响应式原理开篇" tabindex="-1">响应式原理开篇 <a class="header-anchor" href="#响应式原理开篇" aria-label="Permalink to &quot;响应式原理开篇&quot;">​</a></h1><p><code>vue</code>框架带来的最大好处就是将数据和UI解耦，开发者不需要关注<code>dom</code>是如何渲染在页面上的，只需要按照<code>vue</code>提供的语法就可以实现数据动态的渲染在页面上。这里面非常重要的一环便是响应式更新。<a href="https://cn.vuejs.org/guide/extras/reactivity-in-depth.html" target="_blank" rel="noreferrer"><code>Vue</code>官网</a>中也提到<code>Vue</code> 最标志性的功能就是其低侵入性的响应式系统。组件状态都是由响应式的 JavaScript 对象组成的。当更改它们时，视图会随即自动更新。接下来我们会深入的了解到响应式是如何实现的。</p><h2 id="什么是响应式" tabindex="-1">什么是响应式 <a class="header-anchor" href="#什么是响应式" aria-label="Permalink to &quot;什么是响应式&quot;">​</a></h2><p>在探索源码之前，咱们先来聊一下<strong>响应式</strong>的概念。在<strong>Vue官方文档</strong>中写道：</p><blockquote><p><strong>响应性</strong>是一种可以使我们声明式地处理变化的编程范式。</p></blockquote><p><img src="'+c+`" alt="image-20231202201830606"></p><p>这里单元格 A2 中的值是通过公式 <code>= A0 + A1</code> 来定义的 (你可以在 A2 上点击来查看或编辑该公式)，因此最终得到的值为 3，正如所料。但如果你试着更改 A0 或 A1，你会注意到 A2 也随即自动更新了。</p><p>但是在<code>JavaScript</code>这样是不会生效的，我们必须要<strong>定义式</strong>的重新声明变量值才能够更改</p><div class="language-javascript"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#C792EA;">let</span><span style="color:#A6ACCD;"> A0 </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">1</span></span>
<span class="line"><span style="color:#C792EA;">let</span><span style="color:#A6ACCD;"> A1 </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">2</span></span>
<span class="line"><span style="color:#C792EA;">let</span><span style="color:#A6ACCD;"> A2 </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> A0 </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> A1</span></span>
<span class="line"></span>
<span class="line"><span style="color:#A6ACCD;">console</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">log</span><span style="color:#A6ACCD;">(A2) </span><span style="color:#676E95;font-style:italic;">// 3</span></span>
<span class="line"></span>
<span class="line"><span style="color:#A6ACCD;">A0 </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">2</span></span>
<span class="line"><span style="color:#A6ACCD;">console</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">log</span><span style="color:#A6ACCD;">(A2) </span><span style="color:#676E95;font-style:italic;">// 仍然是 3</span></span></code></pre></div><p>所以为了能够让我们的A2动态更新，我们可以定义一个函数，将A2的执行包裹起来，这个函数也就是我们后面会提到的副作用函数。</p><blockquote><p>副作用函数也就是函数的运行会带来状态的改变，当运行完这个函数之后整个应用程序的状态和运行之前可能不一致，我们称之为产生了副作用。我们定义的<code>update</code>函数就行副作用函数，它的副作用是会造成A2变量的更改</p></blockquote><div class="language-javascript"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#C792EA;">let</span><span style="color:#A6ACCD;"> A2</span></span>
<span class="line"><span style="color:#C792EA;">function</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">update</span><span style="color:#89DDFF;">()</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#F07178;">  </span><span style="color:#A6ACCD;">A2</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">=</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">A0</span><span style="color:#F07178;"> </span><span style="color:#89DDFF;">+</span><span style="color:#F07178;"> </span><span style="color:#A6ACCD;">A1</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span></code></pre></div><p>但是光定义了函数不行还得运行，我们很容易想到，我们这个函数运行的时机是当A0和A1值发生变化的时候。所以我们还需要一个函数能够监听到A0和A1的变化。当他们发生变化的时候就会调用我们的副作用函数。</p><blockquote><p><code>A0</code> 和 <code>A1</code> 被视为这个副作用的<strong>依赖</strong> (dependency)，因为在副作用中它们的值会被用来进行计算。由于副作用的运行<strong>依赖</strong><code>A0</code> 和 <code>A1</code> ，因此这个副作用是<code>A0</code> 和 <code>A1</code> 的一个<strong>订阅者</strong> (subscriber)。</p></blockquote><div class="language-javascript"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#82AAFF;">whenDepsChange</span><span style="color:#A6ACCD;">(update)</span></span></code></pre></div><p>这个 <code>whenDepsChange()</code> 函数有如下的任务：</p><ol><li>当一个变量被读取时进行追踪。例如我们执行了表达式 <code>A0 + A1</code> 的计算，则 <code>A0</code> 和 <code>A1</code> 都被读取到了。</li><li>如果一个变量在当前运行的副作用中被读取了，就将该副作用设为此变量的一个订阅者。例如由于 <code>A0</code> 和 <code>A1</code> 在 <code>update()</code> 执行时被访问到了，则 <code>update()</code> 需要在第一次调用之后成为 <code>A0</code> 和 <code>A1</code> 的订阅者。</li><li>探测一个变量的变化。例如当我们给 <code>A0</code> 赋了一个新的值后，应该通知其所有订阅了的副作用重新执行。</li></ol><p><code>Vue</code>响应式原理思想和这个类似，我们的组件渲染/watch/computed都会产生一个副作用函数（类比于上述<code>update</code>），我们用<code>ref</code>等定义的变量是这些副作用函数的依赖（类比A0，A1），当我们的变量发生更新的时候会依次调用依赖了这些变量的副作用函数，从而实现了我们响应式的效果</p><h2 id="vue2的响应式实现" tabindex="-1">Vue2的响应式实现 <a class="header-anchor" href="#vue2的响应式实现" aria-label="Permalink to &quot;Vue2的响应式实现&quot;">​</a></h2><p><img src="`+n+'" alt="image-20231202203903934"></p><p>图来自官方文档，从图中我们能够看到：<strong>初始化时对状态数据做了劫持，在执行组件的<code>render</code>函数时，会访问一些状态数据，就会触发这些状态数据的<code>getter</code>，然后<code>render</code>函数对应的<code>render watcher</code>就会被这个状态收集为依赖，当状态变更触发<code>setter</code>，<code>setter</code>中通知<code>render watcher</code>更新，然后<code>render</code>函数重新执行以更新组件。</strong> 就这样完成了响应式的过程。</p><p>Vue2中通过<code>Object.defineProperty</code>给每个属性设置<code>getter</code>、<code>setter</code>来进行数据的劫持和更新的通知，他的特点如下：</p><ol><li><code>Object.defineProperty</code>是通过给对象新增属性/修改现有属性 来实现数据的劫持。需要遍历对象的每一个<code>key</code>去实现，当遇到很大的对象或者嵌套层级很深的对象，性能问题会很明显。</li><li><code>Object.defineProperty</code>这种方式无法拦截到给对象新增属性这种操作，因为组件初始化不能预知会新增哪些属性，也就没法设置<code>getter/setter</code>，所以我们不得不使用<code>Vue2</code>提供的<code>$set</code>api，再去<code>Object.defineProperty</code>给新增的属性加上<code>getter/setter</code>。</li><li><code>Object.defineProperty</code>支持<code>IE</code>，兼容性较好。</li></ol><p>正是因为第三点，因此<code>Vue2</code>才使用<code>Object.defineProperty</code>去实现数据的劫持，即便它有很多缺点。</p><h2 id="vue3的响应式实现" tabindex="-1">Vue3的响应式实现 <a class="header-anchor" href="#vue3的响应式实现" aria-label="Permalink to &quot;Vue3的响应式实现&quot;">​</a></h2><p><code>Vue3</code>响应式的实现原理和<code>Vue2</code>大致相同，区别主要在于数据劫持的实现方式上，在<code>Vue3</code>中完全抛弃了<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get" target="_blank" rel="noreferrer">getter</a> / <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set" target="_blank" rel="noreferrer">setters</a> 的方式，采用了<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy" target="_blank" rel="noreferrer">Proxy</a>来进行属性的劫持，虽然<code>IE</code>对<code>proxy</code>不支持，但是都这年头了，<code>IE</code>已经是时代的弃子了，能不管就不管了吧。</p><h2 id="小结" tabindex="-1">小结 <a class="header-anchor" href="#小结" aria-label="Permalink to &quot;小结&quot;">​</a></h2><p>这个章节完全没有涉及源码，旨在让大家对响应式的运行流程有一个初步的认识，接下来我们会从源码的角度来讲解<code>vue3</code>响应式原理的具体实现，主要源码不会过于深入，主要是为了让大家对各个函数的职责有大概了解，后续章节再深入各个函数具体的实现。在此之前我们需要了解一些主要的概念：</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>响应式相关的所有代码都位于<code>packages/reactivity</code>目录下，文章所有的源码都已经精简，只保留了最核心部分，完整代码请读者自行查看源码。</p></div>',29),p=[l];function r(d,i,A,y,u,C){return o(),s("div",null,p)}const D=e(t,[["render",r]]);export{h as __pageData,D as default};
