export const sidebar = [
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
    text: "挂载阶段",
    collapsed: false,
    items: [
      {
        text: "初次渲染概览",
        link: "/blogs/mount/",
      },
      {
        text: "虚拟dom",
        link: "/blogs/mount/vnode",
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
    text: "卸载阶段",
    collapsed: false,
    items: [
      {
        text: "卸载概览",
        link: "/blogs/unmount/",
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
        items: [
          {
            text: "parse",
            collapsed: true,
            items: [
              {
                text: "parse概览",
                link: "/blogs/compiler/parse/",
              },
              {
                text: "baseParse",
                link: "/blogs/compiler/parse/baseParse",
              },
              {
                text: "parseInterpolation",
                link: "/blogs/compiler/parse/parseInterpolation",
              },
              {
                text: "parseText",
                link: "/blogs/compiler/parse/parseText",
              },
              {
                text: "parseComment",
                link: "/blogs/compiler/parse/parseComment",
              },
              {
                text: "parseElement",
                link: "/blogs/compiler/parse/parseElement",
              },
              {
                text: "parseTag",
                link: "/blogs/compiler/parse/parseTag",
              },
              {
                text: "parseAttributes",
                link: "/blogs/compiler/parse/parseAttributes",
              },
            ],
          },
        ]
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
      {
        text: "组件生命周期",
        link: "/blogs/apis/lifecycle",
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
];