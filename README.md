# OpenSN 网络仿真平台（演示版）

`ui-mock` 是 OpenSN 网络仿真平台的演示版。页面与真实项目 `ui-new` 一致，但所有请求都由浏览器内的模拟接口处理，不连接后端，构建后可以直接放到 GitHub Pages。

演示版不做真实仿真：启停模拟、启停节点、上传配置、改文件、改数据库条目，改的都是浏览器里的演示数据。

## 演示能做什么

| 页面 | 能做什么 |
| --- | --- |
| 概览 | 查看运行状态与资源统计，操作模拟启停、重置、上传拓扑与节点类型配置，查看三维星座拓扑（Cesium，浏览器里的三维地球库） |
| 网络节点列表 | 搜索节点，启停单个节点，进入节点详情 |
| 部署机器 | 查看 3 台部署机器的角色、容量、地址与剩余可分配节点数 |
| 节点详情 | 查看基本信息、资源曲线（可切时间范围）、连接关系，打开节点终端 |
| 链路列表 | 查看链路状态与两端节点，进入链路详情 |
| 链路详情 | 查看链路参数、地址信息、吞吐与丢包曲线，打开抓包终端 |
| 文件管理 | 浏览虚拟目录，预览文本文件，上传、下载、删除文件 |
| 数据库查看 | 按层级浏览条目，用 JSON 编辑器修改或删除 |
| 帮助 / 关于 | 演示版的使用说明与项目说明 |

顶栏有“演示数据”标记，提示当前是演示模式。

## 环境要求

- Node.js 18 及以上
- npm 9 及以上

不需要后端，也不需要数据库。

## 常用命令

在 `ui-mock/` 下执行：

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 开发服务器，地址 http://localhost:3100 |
| `npm run build` | 打包到 `build/` 目录 |
| `npm run preview` | 本地预览打包结果 |

`make build` 等于 `npm install && npm run build`，`make clean` 删除 `build/`。

## 部署到 GitHub Pages

### 方式一（推荐）：GitHub Actions

仓库里已有 `.github/workflows/deploy.yml`，推送到 `main` 就自动构建并发布。

1. 在 GitHub 新建仓库。可以先留空，不要勾选自动生成 README。
2. 在 `ui-mock/` 里关联远程仓库并推送：

   ```bash
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 打开仓库的 Settings → Pages，Source 选 GitHub Actions。
4. 等 Actions 里的 “Deploy demo to GitHub Pages” 跑完，一般一到两分钟。
5. 访问 `https://<用户名>.github.io/<仓库名>/`。

工作流做三件事：`npm ci` 装依赖、`npm run build` 打包、把 `build/` 发布到 Pages。需要重新发布时，可以在 Actions 页面选中这个工作流，点 Run workflow 手动触发。

### 方式二：手动部署

1. `npm run build`，产物在 `build/`。
2. 把 `build/` 里的内容提交到 `gh-pages` 分支，或仓库里 GitHub Pages 指定的目录。
3. Settings → Pages，Source 选 Deploy from a branch，分支选 `gh-pages`，目录选 `/ (root)`。

手动方式每次改动都要重复一次，日常用方式一即可。

### 不用配置 base 路径

`vite.config.js` 里的 `base` 是 `'./'`，资源用相对路径引用。无论 Pages 地址是仓库根路径还是子路径都能直接打开，不需要改配置。

## 路由说明

项目用 HashRouter，地址形如 `https://<用户名>.github.io/<仓库名>/#/overview`。

GitHub Pages 只提供静态文件，没有服务器把 `/overview` 这类路径回退到 `index.html`。路由信息放到 `#` 后面后，服务器只认 `index.html`，刷新任何页面都不会 404，也不需要为静态站配置路由回退。

## 演示数据

演示数据保存在浏览器 localStorage，键名 `opensn-mock-state-v1`。刷新页面后，启停过的节点、删过的链路、上传的文件都还在。

- 恢复初始数据：打开概览页，点“重置模拟环境”。
- 也可以清理浏览器里该站点（或本地文件）的数据，重新打开页面同样得到初始数据。
- 换一个浏览器、换一台机器，看到的是各自独立的数据。

## 目录说明

`src/` 下一级目录：

| 目录 | 用途 |
| --- | --- |
| `api/` | 接口模块；`api/mock/` 是浏览器内的模拟接口与数据 |
| `components/common/` | 通用组件：页面容器、卡片、状态标签、图表、JSON 编辑器 |
| `components/layout/` | 页面框架：侧边栏、顶栏、面包屑、标签栏、主题开关 |
| `config/` | 应用配置与常量 |
| `context/` | 全局状态：主题、标签页、抽屉 |
| `hooks/` | 通用 hooks：打开页面、定时刷新 |
| `pages/` | 页面，按功能分目录 |
| `router/` | 路由表与菜单表 |
| `styles/` | 全局样式与主题变量 |
| `utils/` | 数字、时间格式化，图表配置生成 |

另外还有两处：`public/mock-terminal.html` 是演示用的模拟终端页面（节点终端和链路抓包终端都指向它），`.github/workflows/deploy.yml` 是 GitHub Actions 发布流程。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/项目结构.md](./docs/项目结构.md) | 目录结构、页面与路由、接口模块、开发步骤 |
| [docs/模拟数据说明.md](./docs/模拟数据说明.md) | 模拟层的文件分工、覆盖的接口、数据怎么变 |
| [docs/GitHub Pages 部署.md](<./docs/GitHub Pages 部署.md>) | 从建仓库到访问地址的完整步骤，常见问题 |
| [change-logs/README.md](./change-logs/README.md) | 变更记录目录与命名规则 |

新同事建议先读 `docs/项目结构.md`，要改演示数据再看 `docs/模拟数据说明.md`。

## 如何继续迭代

1. 改代码。加页面、加接口的步骤见 `docs/项目结构.md`。
2. 在 `ui-mock/` 下跑 `npm run build`，确认能编译通过；需要看效果时用 `npm run dev` 打开页面点一遍。
3. 在 `change-logs/` 新增一份记录，写清背景、内容、涉及文件、验证方式。
4. 提交并推送到 `main`。GitHub Actions 会自动重新构建和发布，等 Actions 跑完刷新页面即可。

## 演示版与真实项目的区别

| 项目 | `ui-new`（真实项目） | `ui-mock`（演示版） |
| --- | --- | --- |
| 数据来源 | 后端接口 `/api` | 浏览器内模拟接口 `src/api/mock/` |
| 后端 | 需要 | 不需要 |
| 终端 | 真实容器里的终端 | `public/mock-terminal.html` 模拟页面 |
| 文件 | 服务器上的文件 | 浏览器里的虚拟文件 |
| 数据保存 | 后端数据库 | 浏览器 localStorage |
| 用户与权限 | 按后端约定 | 没有 |
| 部署 | 与后端同源 | 静态站，可放 GitHub Pages |
| 路由 | BrowserRouter | HashRouter |

`ui-mock` 从 `ui-new` 复制而来，页面结构、组件、样式保持一致，只替换了数据来源和路由方式。两边同时维护时，改页面要留意另一边的同步。
