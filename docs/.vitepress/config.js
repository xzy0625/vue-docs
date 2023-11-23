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
      { text: "🔥前端算法(编写中)", link: "/blogs/blog1/" },
      { text: "💭学习圈子(编写中)", link: "/blogs/blog1/" },
      {
        text: "其他",
        items: [
          // 可以配置成下拉
          { text: "Changelog", link: "/others/changelog" },
          { text: "Contribution", link: "/others/contribution" },
        ],
      },
    ],
    sidebar: {
      // 侧边栏，可以分组
      // 当用户在 `blogs` 目录页面下将会展示这个侧边栏
      "/blogs/blog1/": [
        {
          text: "blog1",
          items: [
            {
              text: "index",
              link: "/blogs/blog1/",
            },
            {
              text: "fisrt",
              link: "/blogs/blog1/first",
            },
            {
              text: "second",
              link: "/blogs/blog1/second",
            },
          ],
        },
      ],
    },
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
};
