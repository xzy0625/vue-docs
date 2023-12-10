import { headerPlugin } from './headerPlugin'
import { sidebar } from './sidebar'

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
    // 侧边栏，可以分组
    // 当用户在 `blogs` 目录页面下将会展示这个侧边栏
    sidebar,
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
