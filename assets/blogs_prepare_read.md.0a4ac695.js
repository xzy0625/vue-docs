import{_ as s,o as a,c as l,U as n}from"./chunks/framework.6462eda8.js";const u=JSON.parse('{"title":"如何调试源代码","description":"","frontmatter":{},"headers":[],"relativePath":"blogs/prepare/read.md","filePath":"blogs/prepare/read.md","lastUpdated":1700831761000}'),o={name:"blogs/prepare/read.md"},e=n(`<h1 id="如何调试源代码" tabindex="-1">如何调试源代码 <a class="header-anchor" href="#如何调试源代码" aria-label="Permalink to &quot;如何调试源代码&quot;">​</a></h1><h2 id="clone" tabindex="-1">clone源代码 <a class="header-anchor" href="#clone" aria-label="Permalink to &quot;clone源代码 {#clone}&quot;">​</a></h2><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#676E95;font-style:italic;"># 使用 ssh</span></span>
<span class="line"><span style="color:#FFCB6B;">git</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">clone</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">git@github.com:vuejs/vue-next.git</span></span>
<span class="line"></span>
<span class="line"><span style="color:#676E95;font-style:italic;"># 或者使用 https</span></span>
<span class="line"><span style="color:#FFCB6B;">git</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">clone</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">https://github.com/vuejs/vue-next.git</span></span></code></pre></div><h2 id="install" tabindex="-1">安装依赖 <a class="header-anchor" href="#install" aria-label="Permalink to &quot;安装依赖 {#install}&quot;">​</a></h2><p>node版本最好 &gt;= 16</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#676E95;font-style:italic;"># 在项目所在的文件夹中</span></span>
<span class="line"><span style="color:#FFCB6B;">pnpm</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">install</span></span></code></pre></div><h2 id="run" tabindex="-1">本地启动（两种方式） <a class="header-anchor" href="#run" aria-label="Permalink to &quot;本地启动（两种方式）{#run}&quot;">​</a></h2><h3 id="方式一" tabindex="-1">方式一 <a class="header-anchor" href="#方式一" aria-label="Permalink to &quot;方式一&quot;">​</a></h3><p>直接跑<code>pnpm run serve</code></p><h3 id="方式二" tabindex="-1">方式二 <a class="header-anchor" href="#方式二" aria-label="Permalink to &quot;方式二&quot;">​</a></h3><ol><li>根目录运行 <code>pnpm run dev</code>。会热更新我们的修改</li><li>找到<code>packages/vue/examples/*</code>下面的html文件</li><li>使用<code>vscode</code>的<code>live-server</code>插件运行html文件。会打开一个本地ip端口的web服务器</li><li>在浏览器中就可以调试了</li></ol><p>如果需要在vscode中进行调试还需要做以下事情</p><ol start="5"><li><p>安装<code>javascript deugger</code>插件</p></li><li><p>添加<code>vscode</code>调试配置。例如:</p><div class="language-json"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">version</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">0.2.0</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C792EA;">configurations</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">[</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">      </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">name</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Launch Chrome</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">      </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">request</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">launch</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">      </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">type</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">chrome</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">      </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">url</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">http://127.0.0.1:5501/</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">,</span></span>
<span class="line"><span style="color:#A6ACCD;">      </span><span style="color:#89DDFF;">&quot;</span><span style="color:#FFCB6B;">webRoot</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">\${workspaceFolder}</span><span style="color:#89DDFF;">&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">]</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span></code></pre></div></li></ol><blockquote><ul><li>这里的url一定要和我们live-sever打开的一样，不然无法访问（如果是直接<code>pnpm run serve</code>填写对应的url链接即可）</li></ul></blockquote><h2 id="debugger" tabindex="-1">启动调试 <a class="header-anchor" href="#debugger" aria-label="Permalink to &quot;启动调试 {#debugger}&quot;">​</a></h2><ol><li><p>在<code>vscode</code>中启动<code>javascript deugger</code>调试，会打开我们配置中的<code>url</code>路径，我们在路径后面拼上对应的html路径即可访问不同的html文件。</p></li><li><p>然后就可以愉快的在vscode中打断点调试了。</p></li></ol><p><img src="https://csuxzy-images-1300770696.cos.ap-guangzhou.myqcloud.com/image-20231110120642689.png" alt="image-20231110120642689"></p>`,17),p=[e];function t(c,r,i,D,F,y){return a(),l("div",null,p)}const C=s(o,[["render",t]]);export{u as __pageData,C as default};
