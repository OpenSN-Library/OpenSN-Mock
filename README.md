# OpenSN 前端（ui-new）

OpenSN 网络仿真平台的前端重构版。仓库里还有一份旧前端 `ui/`，用 Create React App 搭建，仍然保留、可以正常启动。本目录用 Vite 5 重写，页面和目录重新整理，功能与旧版对应。

构建产物在 `build/` 目录。部署到后端时，把 `build/` 里的内容放进后端的静态文件目录。仓库根目录的 Makefile 目前仍构建旧 `ui/`，要改用本目录打包，需要把其中 `cd ui` 改成 `cd ui-new`。

## 环境要求

- Node.js 18 及以上
- npm 9 及以上

## 常用命令

在 `ui-new` 目录下执行：

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器，默认地址 http://localhost:3100 |
| `npm run build` | 打包，产物在 `build/` 目录 |
| `npm run preview` | 本地预览打包结果 |
| `make build` | 等于 `npm install && npm run build` |
| `make clean` | 删除 `build/` 目录 |

说明：

- `npm start` 与 `npm run dev` 相同。
- 开发服务器监听 `0.0.0.0:3100`，同网段的其他机器也能访问。
- 开发时 `/api` 请求由 Vite 代理到 `http://127.0.0.1:8080`，即本机后端。端口和代理地址写在 `vite.config.js` 里。
- 打包前会清空 `build/`。单文件体积警告上限调到 4 MB，因为 Cesium 体积较大。

## 目录说明

`src/` 下一级目录：

| 目录 | 用途 |
| --- | --- |
| `api/` | 后端接口，按业务拆分模块 |
| `components/common/` | 通用组件：页面容器、半透明卡片、状态标签、图表、JSON 编辑器 |
| `components/layout/` | 页面框架：侧边栏、顶栏、面包屑、标签栏、主题开关 |
| `config/` | 应用配置与常量 |
| `context/` | 全局状态：主题、标签页、抽屉 |
| `hooks/` | 通用 hooks：打开页面、定时刷新 |
| `pages/` | 页面，按功能分目录 |
| `router/` | 路由表与菜单表 |
| `styles/` | 全局样式与主题变量 |
| `utils/` | 数字、时间格式化，图表配置生成 |

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/项目结构.md](./docs/项目结构.md) | 目录结构、页面与路由、接口模块、开发步骤 |
| [change-logs/README.md](./change-logs/README.md) | 变更记录目录与命名规则 |

新同事建议先读 `docs/项目结构.md`，再按里面的步骤加页面。

## 与后端的关系

前端与后端同源部署，接口统一挂在 `/api` 下。后端返回 `{ code, msg, data }`，`code` 不为 0 时按失败处理，错误提示交给页面显示。

开发阶段后端不在本机时，改 `vite.config.js` 里的代理地址即可。
