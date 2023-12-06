import{_ as e,o as a,c as o,U as t}from"./chunks/framework.df9742f3.js";const b=JSON.parse('{"title":"前言","description":"","frontmatter":{},"headers":[],"relativePath":"blogs/start/start.md","filePath":"blogs/start/start.md","lastUpdated":1701848207000}'),r={name:"blogs/start/start.md"},c=t('<h1 id="前言" tabindex="-1">前言 <a class="header-anchor" href="#前言" aria-label="Permalink to &quot;前言&quot;">​</a></h1><p>最近项目开发中技术栈从<code>react</code>迁到了<code>vue</code>，虽然之前有过<code>vue</code>的项目开发经验，但是都是停留在使用的层面，对核心原理一知半解，于是乎便有了阅读源码的想法，想从更深的层面去了解这类优秀的开源框架究竟是如何支撑起我们众多大型网页的。并且由于之前也阅读过<code>react18</code>的源码（<a href="https://xzy0625.github.io/react-docs/" target="_blank" rel="noreferrer"><strong>react18源码解析也在紧急筹备中，欢迎关注</strong></a>)，因此对于这两个知名框架的运行流程有何差异也颇有兴趣。这个网站也算是对于自己学习过程的一个记录。</p><h2 id="为什么要学习源码" tabindex="-1">为什么要学习源码 <a class="header-anchor" href="#为什么要学习源码" aria-label="Permalink to &quot;为什么要学习源码&quot;">​</a></h2><p>很多人好奇框架我又不是不会用，为什么需要去阅读源码呢，这个想法很正常，毕竟我们只是框架的使用者，并不是开发者，而且前端框架变化莫测，指不定过多久又有更优秀的开源框架，所以对于普通使用者来说，我们只需要了解框架的大概原理和熟悉api的使用就好了，一样能在业务上风生水起。</p><p>但是对于大多数前端开发者来说，<code>vue</code>和<code>react</code>还是我们开发前端页面中首选的框架，未来几年内也大概率是，所以为了我们更好的开发熟悉源码也是非常必要的。为什么要阅读源码，可以从下面几个方面解释：</p><h3 id="熟悉源码可以让我们对自己的代码更有自信" tabindex="-1">熟悉源码可以让我们对自己的代码更有自信 <a class="header-anchor" href="#熟悉源码可以让我们对自己的代码更有自信" aria-label="Permalink to &quot;熟悉源码可以让我们对自己的代码更有自信&quot;">​</a></h3><p>如果我们对于整个框架的运行原理有深刻的理解，那么我们开发的时候所产生的<code>bug</code>必然会更少，也能利用框架的特性写出性能更高的代码。同时，当我们或者同事遇到毫无头绪的报错时，熟悉源码的我们又能好好的展现一把了，树立自己技术大佬的人设(doge)</p><h3 id="阅读优秀的代码的目的是让我们能够写出优秀的代码" tabindex="-1">阅读优秀的代码的目的是让我们能够写出优秀的代码 <a class="header-anchor" href="#阅读优秀的代码的目的是让我们能够写出优秀的代码" aria-label="Permalink to &quot;阅读优秀的代码的目的是让我们能够写出优秀的代码&quot;">​</a></h3><p>其实写代码就跟我们写作文一样，你看的高分作文越多，写出高分作文的概率就越大。同理，我们看过的优质代码越多，能写出优质代码的概率就越大。这类优秀的开源库每一行代码都是经过深思熟虑的，也都是通过时间和业务检验的，通过仔细品味这些代码，我们的技术水平也会水涨船高。</p><h3 id="为了找到更好的工作" tabindex="-1">为了找到更好的工作 <a class="header-anchor" href="#为了找到更好的工作" aria-label="Permalink to &quot;为了找到更好的工作&quot;">​</a></h3><p>从功利性的角度上来说，熟悉源码可以让我们找到更好的工作。毕竟框架人人都会使用，但如果不仅会使用，还熟悉底层原理，对于找工作必然是加分项。相信大部分同学也是因为这个才去阅读源码。不过有了这个功利目标，大家看源码的毅力也会更高些哈哈。</p><h2 id="如何学习源码" tabindex="-1">如何学习源码 <a class="header-anchor" href="#如何学习源码" aria-label="Permalink to &quot;如何学习源码&quot;">​</a></h2><p>已经确定我们就是要阅读源码，那么我们该如何上手阅读源码呢。</p><h3 id="了解大体运行流程" tabindex="-1">了解大体运行流程 <a class="header-anchor" href="#了解大体运行流程" aria-label="Permalink to &quot;了解大体运行流程&quot;">​</a></h3><p>我们阅读源码的时候首先需要知道项目是如何运行的。首先我们需要知道<code>vue</code>是什么东西，有哪些特性，如何使用的，这就要求我们至少仔仔细细的把官方文档阅读一遍。之后我们就可以写一个最小的文本节点，通过断点一步步调试，抛去细枝末节的地方，对整个项目有一个宏观上的认识。这一点上遇到不会的地方一定不要心急，不懂很正常，不可能一口吃成一个胖子，何况是这种大型仓库呢。</p><h3 id="单点突破" tabindex="-1">单点突破 <a class="header-anchor" href="#单点突破" aria-label="Permalink to &quot;单点突破&quot;">​</a></h3><p>对整体项目有了一个大体了解之后我们就可以对一些核心的点一个个突破，例如<code>ref</code>,<code>watch</code>,<code>reactive</code>等等。这个过程可以结合项目中给的一些测试用例去看，了解这个功能的边界和运行原理。</p><h4 id="系统阅读" tabindex="-1">系统阅读 <a class="header-anchor" href="#系统阅读" aria-label="Permalink to &quot;系统阅读&quot;">​</a></h4><p>当我们对核心的点有了深刻的认识之后就需要站在整个项目的角度去思考为什么要这么设计，各个核心功能是如何串行起来的。当我们了解到其中的设计思想和架构理念之后，我们才算真正的精通了源码，如果有可能还能去<code>github</code>上提交<code>pr</code>，到时候我们也是<code>vue</code>的<code>commiter</code>了😊</p><h2 id="祝福语" tabindex="-1">祝福语 <a class="header-anchor" href="#祝福语" aria-label="Permalink to &quot;祝福语&quot;">​</a></h2><p>最后希望大家都能达到自己想要达到的高度，成为<code>vue</code>大师。接下来让我们一起在源码的只是海洋里面遨游吧～</p>',21),d=[c];function h(i,s,l,n,p,u){return a(),o("div",null,d)}const f=e(r,[["render",h]]);export{b as __pageData,f as default};