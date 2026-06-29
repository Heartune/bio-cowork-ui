# 医研协作台 · BioCowork

医研协作台 BioCowork 是面向临床与生物医学研究人员的低门槛 Agentic 协作台前端原型。其产品逻辑参考
[Claude Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)，
即「描述一个结果，离开一会儿，回来时工作已经完成」，而本项目将这一逻辑迁移到临床数据分析场景。在该场景中，
研究人员以自然语言描述数据与问题，Claude 据此拟定计划、读取数据、运行统计、产出图表与可追溯报告，
并在关键步骤暂停以征求确认。

设计语言为临床编辑感。界面采用暖色纸面底、墨黑正文与单一临床青绿主色，标题依靠字号与字重建立层级，
背景叠加低对比度的脉冲曲线与数据网格。

## 三条产品红线

产品设计贯穿三条约束。其一为数据本地不出域，所有数据仅在本机读取与处理，不进行上传。其二为关键步骤人工确认，
在写盘、删除等动作执行前暂停并征求同意。其三为医生可读，风险比、p 值等统计量始终附带自然语言解释。

## 运行

```bash
npm install
npm run dev        # 开发服务器（默认 http://localhost:5180）
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

由于 `vite.config.js` 采用相对 `base` 与 `HashRouter` 路由，`npm run build` 生成的 `dist/index.html`
可直接部署到任意静态目录。

## 关键页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 新建分析 | Hero、输入框、数据与方式与模型上下文控件、常见任务 |
| `/session/:id` | 实时工作台（核心） | 计划复核进入执行流，执行流含推理、子任务、工具调用、审批、产物与小结，右侧为产物与文件与计划面板，并配可随时打断的操纵框 |
| `/research` | 我的研究 | 按课题归档的会话列表，支持搜索与筛选 |
| `/reports` | 图表与报告 | 所有产物的画廊，支持模态预览与下载 |
| `/skills` | 技能库 | 临床可视化、建模、数据体检、报告等可启用技能 |
| `/scheduled` | 定时随访 | 让分析按节奏自动重跑并提示复核 |
| `/data` | 数据源 | 本地 CSV 与 Excel 的浏览器内本地解析，以及院内 MCP 连接器 |
| `/settings` | 自定义 | 全局指令、权限模式、联网开关、默认模型、红线开关 |

## 实现边界

本原型在真实功能与脚本化模拟之间有明确划分。真实功能方面，导航以及会话、设置、定时、数据源的状态均持久化到
`localStorage`，添加本地 CSV 时在浏览器内完成真实的行列解析，产物可导出为 CSV 或 Markdown 至本机，数据不出域。
脚本化模拟方面，仅 Agent 的推理与执行流为模拟，原因是项目不含真实后端与大语言模型；执行节奏、工具调用与审批暂停
由 `src/lib/runEngine.js` 状态机依据 `src/lib/scenarios.js` 中的剧本回放。内置数据为合成肺癌随访队列，
位于 `src/lib/clinicalData.js`，其中所有数字仅用于演示，不构成任何真实临床结论。

## 代码结构

```
src/
  main.jsx / App.jsx          入口与路由
  index.css                   设计系统，含设计令牌、基础样式与动效
  lib/
    Icon.jsx                  统一线性图标
    store.jsx                 localStorage 持久化的全局状态与 Toast
    seed.js                   初始种子数据，含会话、定时、数据源与设置
    clinicalData.js           合成队列的分析结果，含 KM、Table1 与 Cox
    scenarios.js              脚本化执行剧本
    runEngine.js              执行引擎状态机，含权限门控
    exporters.js              本地 CSV 与 Markdown 导出
  components/
    Sidebar / Dropdown / ArtifactView
    charts/                   KMCurve / BaselineTable / ForestPlot / ReportDoc，均为自绘 SVG
    workspace/                PlanCard / StreamEvent / ArtifactPanel
  pages/                      Home / Session / Research / Reports / Skills / Scheduled / DataSources / Settings
reference/
  home-prototype.html         最初的单文件原型，用作设计参考
```

v0.2，单机前端原型。
