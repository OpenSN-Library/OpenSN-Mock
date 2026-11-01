# 2026-11-01 · 演示数据层与 GitHub Pages 部署

## 变更背景

`ui-new` 是连接真实后端的前端。想展示页面和交互，就得先起后端、导入拓扑、跑起模拟，演示和给别人看都不方便。

因此从 `ui-new` 复制一份 `ui-mock`，把请求换到浏览器内处理，数据放在 localStorage，构建成静态站就能发布到 GitHub Pages。页面、组件、样式保持不变，只替换数据来源和路由方式。

目标是：打开页面就能看到完整界面，主要的增删改操作都能点通，不需要后端、数据库和容器。不追求真实仿真，所有数据都是演示数据。

## 变更内容

1. 从 `ui-new` 复制前端工程，作为演示版基础。页面结构、组件、样式与 `ui-new` 一致。
2. axios 换模拟 adapter。`src/api/client.js` 增加自定义 adapter，把请求交给 `src/api/mock/server.js`，页面代码不用改，接口路径、参数、`{ code, msg, data }` 返回结构都与真实后端保持一致。
3. 新增模拟数据层。`mock/data.js` 生成初始数据：3 台部署机器、16 个网络节点（12 颗卫星、4 个地面站）、24 条链路、一套虚拟文件目录和数据库条目；`mock/state.js` 保存状态并写入 localStorage；`mock/metrics.js` 按时间生成资源曲线；`mock/server.js` 按路径分发请求。
4. 终端改为本地模拟页。新增 `public/mock-terminal.html`，节点详情的终端和链路详情的抓包终端都指向它；文件下载改成把内容转成 data URL，不再请求下载接口。
5. 路由与构建调整。`src/main.jsx` 从 BrowserRouter 换成 HashRouter；`vite.config.js` 去掉 `/api` 代理，`base` 设为 `'./'`，打包产物在 `build/`，预览端口仍是 3100。
6. 页面提示调整。顶栏加“演示数据”标记；帮助页、关于页改成演示版说明，并写清数据保存在浏览器里、怎么重置。
7. 部署流程。新增 `.github/workflows/deploy.yml`，推送到 `main` 或手动触发时执行 `npm ci`、`npm run build`，把 `build/` 发布到 GitHub Pages。
8. 仓库与记录。新建 `ui-mock` 的 git 仓库，保留 `ui-new` 原有的 4 条变更记录，本次改动单独记一份。

## 涉及文件

模拟层：

- 新增 `src/api/mock/server.js`：模拟接口分发，路径与真实后端一致
- 新增 `src/api/mock/data.js`：初始演示数据
- 新增 `src/api/mock/state.js`：演示状态与 localStorage 读写、重置
- 新增 `src/api/mock/metrics.js`：按时间生成的资源曲线
- 修改 `src/api/client.js`：自定义 adapter，把请求转给模拟接口
- 修改 `src/api/file.js`：下载改成本地生成 data URL

页面适配：

- `src/main.jsx`：BrowserRouter 换成 HashRouter
- `src/components/layout/Header.jsx`：顶栏加“演示数据”标记
- `src/pages/help/HelpPage.jsx`、`src/pages/help/AboutPage.jsx`：改成演示版说明
- `src/pages/nodes/NodeDetail.jsx`、`src/pages/links/LinkDetail.jsx`：终端地址改用模拟页返回的地址

构建与部署：

- `package.json`、`index.html`、`vite.config.js`、`.gitignore`
- 新增：`public/mock-terminal.html`、`.github/workflows/deploy.yml`

文档：

- `README.md`、`docs/项目结构.md`
- 新增：`docs/模拟数据说明.md`、`docs/GitHub Pages 部署.md`、`change-logs/2026-11-01-演示数据层与GitHub Pages部署.md`
- `change-logs/README.md`

## 验证方式

1. 在 `ui-mock/` 下执行 `npm install` 和 `npm run build`，已通过，产物在 `build/`。
2. 把 `build/` 放到子路径下（模拟 GitHub Pages 的地址），用浏览器逐页检查：概览统计和三维画布正常，节点详情、链路详情标签页正常。
3. 实际操作：节点启动、停止正常；点“重置模拟环境”后恢复成未启动状态。
4. 文件树能展开并预览文件；数据库的 JSON 编辑器可用；节点终端和抓包终端的模拟终端 iframe 正常打开。
5. Hash 路由刷新不 404；页面没有任何发往后端的 `/api` 请求，控制台没有报错。

以上检查覆盖演示版的主要页面和操作，没有发现报错。

Actions 里用的 Node.js 是 20。
