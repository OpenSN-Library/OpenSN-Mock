# GitHub Pages 部署

本文说明怎么把 `ui-mock` 发布成静态站点。全部操作在浏览器和命令行里完成，不需要服务器。

## 前提

- 本机装了 Node.js 18 及以上，能执行 `npm install` 和 `npm run build`。
- 有 GitHub 账号，并且能创建一个空仓库。
- 本目录已经在 git 仓库里，分支叫 `main`。

## 方式一（推荐）：GitHub Actions

仓库里已有 `.github/workflows/deploy.yml`，推送到 `main` 就自动构建并发布，不需要本地保留构建产物。

### 1. 在 GitHub 新建仓库

打开 GitHub，右上角 New repository，填仓库名，不要勾选 “Add a README file”，创建后拿到仓库地址。

### 2. 关联远程仓库并推送

仓库已经初始化，分支是 `main`。在本目录执行：

```bash
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

> 补充：如果这个目录还不是 git 仓库，先执行 `git init -b main`、`git add .`、`git commit -m "OpenSN 演示版"`，再执行上面的命令。

### 3. 开启 Pages

打开仓库的 Settings → Pages，在 Build and deployment 下把 Source 选成 **GitHub Actions**。只需要设置一次。

### 4. 等 Actions 跑完

打开仓库的 Actions 页面，能看到名为 “Deploy demo to GitHub Pages” 的运行记录。点进去可以看进度：装依赖、打包、上传构建产物、发布。第一次通常一到两分钟。

### 5. 打开页面

地址规则：

- 普通仓库（项目站）：`https://<用户名>.github.io/<仓库名>/`
- 用户站（仓库名是 `<用户名>.github.io`）：`https://<用户名>.github.io/`

打开后地址栏会变成带 `#` 的形式，例如 `.../#/overview`，这是正常的。

### 工作流做了什么

`.github/workflows/deploy.yml` 在推送到 `main` 或手动触发时运行：

| 步骤 | 内容 |
| --- | --- |
| Checkout | 拉取仓库代码 |
| Setup Node.js | 安装 Node.js 20，启用 npm 缓存 |
| Install dependencies | `npm ci`，按 `package-lock.json` 安装 |
| Build | `npm run build`，产物在 `build/` |
| Configure Pages | 读取 Pages 配置 |
| Upload artifact | 把 `build/` 上传为 Pages 产物 |
| Deploy to GitHub Pages | 发布并输出页面地址 |

工作流需要 `pages: write` 和 `id-token: write` 权限，文件里已经写好，不用改。

### 手动触发

改了配置想重新发布，不用新增提交：打开 Actions，左侧选 “Deploy demo to GitHub Pages”，点右侧 Run workflow，选 `main` 分支执行。这对应工作流里的 `workflow_dispatch` 触发器。

## 方式二：手动部署

不想用 Actions 时，可以本地构建后把产物放到 `gh-pages` 分支。

1. 构建：

   ```bash
   npm run build
   ```

2. 把 `build/` 里的内容提交到一个单独的 `gh-pages` 分支：

   ```bash
   mkdir -p /tmp/opensn-pages
   cp -R build/. /tmp/opensn-pages/
   cd /tmp/opensn-pages
   git init -b gh-pages
   git add .
   git commit -m "发布演示版"
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -f origin gh-pages
   ```

3. 打开仓库 Settings → Pages，Source 选 **Deploy from a branch**，分支选 `gh-pages`，目录选 `/ (root)`，保存后等一两分钟。

也可以用另一种做法：把 `build/` 的内容复制到仓库的 `docs/` 目录，Pages 里选 `main` 分支的 `/docs`。两种方式效果一样，选一种即可。

手动方式每次改动都要重新构建并推送一次，日常还是用方式一。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 打开是白屏 | 先看 Settings → Pages 的 Source 是否为 GitHub Actions；再看 Actions 最近一次是否成功；最后看浏览器 Console 有没有资源 404。 |
| 样式或图标丢失 | 多半是 `vite.config.js` 里的 `base` 被改掉了，应该保持 `'./'`，资源才用相对路径。 |
| 三维拓扑不显示 | 浏览器要支持 WebGL；先确认 Console 有没有 Cesium 相关报错。首次加载 Cesium 的静态资源会慢一些，等几秒再刷新。底图不请求在线地图服务，断网也能显示地球。 |
| 刷新页面 404 | 本项目用 HashRouter，正常不会出现。如果以后改成 BrowserRouter，Pages 没有路由回退，刷新非首页会 404。 |
| 页面还是旧内容 | 等 Actions 跑完并显示成功；再强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）。 |
| 仓库地址变了 | 到 Settings → Pages 里看实际地址，或到 Actions 的部署记录里点输出的页面链接。 |

### 自定义域名（可选）

有自己的域名时，在 Settings → Pages → Custom domain 填域名并保存，按提示到域名服务商配置一条 CNAME 记录指向 `<用户名>.github.io`，开启 HTTPS。配置成功后 Pages 会在仓库里生成 `CNAME` 文件，不要删掉。之后用 `https://<域名>/` 访问，页面里的 `#` 路由不受影响。

## 增量迭代

- 改完代码提交并推送到 `main`，Actions 自动重新构建和发布，等它跑完刷新页面即可。
- 发布失败时先看 Actions 日志，常见原因是依赖安装失败或 `npm run build` 报错，本地跑一遍同样的命令就能看到原因。
- 回滚用 `git revert <提交>` 生成一个反向提交再推送，不要在 `main` 上强推改历史。Actions 会按新提交重新发布，Pages 上的旧版本随之被替换。
- 每次改动仍然在 `change-logs/` 留一份记录，见 [change-logs/README.md](../change-logs/README.md)。
