# 如何调试源代码
## clone源代码 {#clone}

```bash
# 使用 ssh
git clone git@github.com:vuejs/vue-next.git

# 或者使用 https
git clone https://github.com/vuejs/vue-next.git
```

## 安装依赖 {#install}
node版本最好 >= 16
```bash
# 在项目所在的文件夹中
pnpm install
```

## 本地启动（两种方式）{#run}

### 方式一

直接跑`pnpm run serve`

### 方式二

1. 根目录运行 `pnpm run dev`。会热更新我们的修改
2. 找到`packages/vue/examples/*`下面的html文件
3. 使用`vscode`的`live-server`插件运行html文件。会打开一个本地ip端口的web服务器
4. 在浏览器中就可以调试了

如果需要在vscode中进行调试还需要做以下事情

5. 安装`javascript deugger`插件

6. 添加`vscode`调试配置。例如:

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Launch Chrome",
         "request": "launch",
         "type": "chrome",
         "url": "http://127.0.0.1:5501/",
         "webRoot": "${workspaceFolder}"
       }
     ]
   }
   ```

  > - 这里的url一定要和我们live-sever打开的一样，不然无法访问（如果是直接`pnpm run serve`填写对应的url链接即可）
   
## 启动调试 {#debugger}
1. 在`vscode`中启动`javascript deugger`调试，会打开我们配置中的`url`路径，我们在路径后面拼上对应的html路径即可访问不同的html文件。

2. 然后就可以愉快的在vscode中打断点调试了。

![image-20231110120642689](https://csuxzy-images-1300770696.cos.ap-guangzhou.myqcloud.com/image-20231110120642689.png)