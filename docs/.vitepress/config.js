import { headerPlugin } from './headerPlugin'

export default {
  title: "vue3.3.8源码解析", // 博客的标题
  description: "vue3.3.8相关学习文档", // 博客的介绍
  base: "/vue-docs/", // 根路径,如果想用github.io访问这个必填，需和github仓库名字一致 【https://vitejs.cn/vitepress/guide/deploy.html#github-pages-%E5%92%8C-travis-ci】
  lastUpdated: true, // 开启最后更新时间
  themeConfig: {
    logo: "/images/logo.png", // 页面上显示的logo
    algolia: {
      appId: '94RGZI7OSQ',
      apiKey: '5d80235956f58d7af794ee20612b15ba', // 这里是algolia的key和indexName，请自行前往申请
      indexName: 'vue-docs',
      placeholder: '请输入关键词',
      buttonText: '搜索',
    },
    nav: [
      // 页面右上角的导航
      { text: "🌊react18源码解析", link: "https://xzy0625.github.io/react-docs/" },
      { text: "🔥前端算法(编写中)", link: "/blogs/start/start" },
      { text: "💭学习圈子(编写中)", link: "/blogs/start/start" },
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
              link: "/blogs/raective/",
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
