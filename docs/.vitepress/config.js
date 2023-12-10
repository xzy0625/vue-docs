import { headerPlugin } from './headerPlugin'

export default {
  title: "vue3源码解析", // 博客的标题
  description: "vue3源码解析", // 博客的介绍
  base: "/vue-docs/", // 根路径,如果想用github.io访问这个必填，需和github仓库名字一致 【https://vitejs.cn/vitepress/guide/deploy.html#github-pages-%E5%92%8C-travis-ci】
  lastUpdated: true, // 开启最后更新时间
  themeConfig: {
    logo: "/images/logo.png", // 页面上显示的logo
    // algolia搜索 https://blog.csdn.net/weixin_42429718/article/details/128361258
    // 配置详见 https://github.com/vuejs/vitepress/blob/main/types/docsearch.d.ts
    // 这里有一个坑，vitepress会自动给请求带上facetFilter属性，所以我们在crawlerConfig中必须配置lang,然后还要在后台配置facet，添加lang
    // https://dashboard.algolia.com/apps/MVMNAC3H5Z/explorer/configuration/vueDocs/facets
    // https://docsearch.algolia.com/docs/api#searchparameters @doSearch文档
    algolia: {
      appId: 'MVMNAC3H5Z',
      apiKey: '8f79ce6a0636cc5034de86b6178dfb8a', // 这里是algolia的key和indexName，请自行前往申请
      indexName: 'vueDocs',
      placeholder: '请输入关键词',
      buttonText: '搜索',
      searchParameters: {
        // attributesToRetrieve: ['*'],
        // attributesToSnippet: ['*:80'],
      }
    },
    nav: [
      // 页面右上角的导航
      { text: "🌊react18源码解析", link: "https://xzy0625.github.io/react-docs/" },
      { text: "🌞前端知识日积月累", link: "https://xzy0625.github.io/js-interview/" },
      { text: "🔥前端算法(编写中)", link: "/blogs/start/start" },
      { text: "💭个人主页", link: "http://zyxiong.com/" },
      {
        text: "其他",
        items: [
          // 可以配置成下拉
          { text: "Changelog", link: "/others/changelog" },
          { text: "Contribution", link: "/others/contribution" },
        ],
      },
    ],
    sidebar: 
      // 侧边栏，可以分组
      // 当用户在 `blogs` 目录页面下将会展示这个侧边栏
      [
        {
          text: "前言",
          collapsed: false,
          items: [
            {
              text: "为什么要学习源码",
              link: "/blogs/start/start",
            },
          ],
        },
        {
          text: "准备工作",
          collapsed: false,
          items: [
            {
              text: "如何调试源码",
              link: "/blogs/prepare/read",
            },
            {
              text: "源码目录结构",
              link: "/blogs/prepare/structure",
            },
          ],
        },
        {
          text: "前置知识",
          collapsed: false,
          items: [
            {
              text: "Proxy",
              link: "/blogs/pre-knowledge/proxy",
            },
            {
              text: "Map和WeakMap",
              link: "/blogs/pre-knowledge/map",
            },
            {
              text: "Set和WeakSet",
              link: "/blogs/pre-knowledge/set",
            },
            {
              text: "二进制操作",
              link: "/blogs/pre-knowledge/binary",
            },
          ],
        },
        {
          text: "初次渲染",
          collapsed: false,
          items: [
            {
              text: "初次渲染概览",
              link: "/blogs/mount/",
            },
          ],
        },
        {
          text: "响应式核心",
          collapsed: false,
          items: [
            {
              text: "响应式概览",
              link: "/blogs/reactive/",
            },
            {
              text: "reactive & ref",
              link: "/blogs/reactive/reactive&ref",
            },
            {
              text: "track & trigger",
              link: "/blogs/reactive/track&trigger",
            },
            {
              text: "reactiveEffect",
              link: "/blogs/reactive/reactiveEffect",
            },
          ],
        },
        {
          text: "更新阶段",
          collapsed: false,
          items: [
            {
              text: "更新阶段概览",
              link: "/blogs/update/",
            },
            {
              text: "diff算法",
              link: "/blogs/update/diff",
            },
          ],
        },
        {
          text: "编译模块",
          collapsed: false,
          items: [
            {
              text: "编译概览",
              link: "/blogs/compiler/",
            },
          ],
        },
        {
          text: "核心工具",
          collapsed: false,
          items: [
            {
              text: "调度器scheduler",
              link: "/blogs/utils/scheduler",
            },
          ],
        },
        {
          text: "常用api",
          collapsed: false,
          items: [
            {
              text: "watch",
              link: "/blogs/apis/watch",
            },
            {
              text: "computed",
              link: "/blogs/apis/computed",
            },
            {
              text: "nextTick",
              link: "/blogs/apis/nextTick",
            },
            {
              text: "forceUpdate",
              link: "/blogs/apis/forceUpdate",
            },
          ],
        },
        {
          text: "内置组件",
          collapsed: false,
          items: [
            {
              text: "keep-alive",
              link: "/blogs/inner-component/keep-alive",
            },
          ],
        },
      ],
    docFooter: { prev: '上一篇', next: '下一篇' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present vue-docs'
    },
    lastUpdatedText: "最近更新时间",
    // 编辑连接
    editLink: {
      pattern: "https://github.com/xzy0625/vue-docs/tree/master/docs/:path", // 这里换成自己的github连接
      text: 'Edit this page on GitHub'
    },
    socialLinks: [{ icon: "github", link: "https://github.com/xzy0625/vue-docs" }], // 可以连接到 github
  },
  markdown: {
    config(md) {
      md.use(headerPlugin)
      // .use(textAdPlugin)
    }
  },
};
