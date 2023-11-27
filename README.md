# vitepress-blog

## 快速开始
```bash
cd ./{projectName}
yarn
yarn dev
```

## github pages部署
### 一：新建仓库
新建github仓库，并将本项目和仓库进行关联

### 二：检查deploy.yml

1. `.github/workflows/deploy.yml `放置github action文件，当我们push项目到远程之后会自动触发acion。
2. ***需特别注意配置中我们监听的分支，如果你的主分支为main，请更改为main*

> on:
>
>   push:
>
> ​    branches:
>
> ​      \- master

### 三：开启github pages

> 注意gh-pages分支只有在构建完一次action之后才会存在

![github-pages](https://csuxzy-images-1300770696.cos.ap-guangzhou.myqcloud.com/github-pages.png)

如遇到问题

> GitHub Action: The process ‘/usr/bin/git‘ failed with exit code 128

解决方式

![question](https://csuxzy-images-1300770696.cos.ap-guangzhou.myqcloud.com/question.webp)

## 启用Algolia搜索
参考文档: 
1. https://juejin.cn/post/7161320316285747231
2. https://juejin.cn/post/7070109475419455519

## 启用评论
https://github.com/Justin3go/justin3go.github.io/blob/8a23802018209e1510626e780439ecbc8d4bb05d/docs/%E5%8D%9A%E5%AE%A2/2023/06/06%E7%AE%80%E5%8D%95%E4%BC%98%E5%8C%96%E4%B8%8B%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2%E9%A6%96%E9%A1%B5(%E8%BF%81%E7%A7%BBvitepress-beta%E7%89%88).md#L21

## 其他配置

`docs/.vitepress/config.js`文件的内容请参照vitepress自行配置

## 参考文档
[vitepress](https://vitepress.dev/reference/default-theme-last-updated)
https://process1024.github.io/vitepress/guide/theme-search
https://juejin.cn/post/7164276166084263972
algolia配置：https://blog.csdn.net/weixin_44495599/article/details/132022146

## 自定义主题
https://juejin.cn/post/7145721012598865928

## 语法
https://www.caijiuming.com/vitepress/