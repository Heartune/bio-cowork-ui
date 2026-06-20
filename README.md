# 医研协作台 · BioCowork

面向临床 / 生医研究人员的低门槛 **Agentic 协作台**前端原型。灵感来自
[Claude Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)
的产品逻辑——「描述一个结果，离开一会儿，回来时工作已经完成」——但把场景换成临床数据分析：
医生用大白话描述数据和问题，Claude 拟定计划、读数、跑统计、出图表与可追溯报告，
并在关键步骤停下来征求确认。

> 设计语言：**临床编辑感（Clinical Editorial）**——暖纸底、墨黑正文、唯一可信赖的临床青绿，
> 标题用衬线传达严谨；背景藏一条极淡的心电脉冲与数据网格。

## 三条产品红线（贯穿全程）

1. **数据本地不出域** — 所有数据只在本机读取与处理，绝不上传。
2. **关键步骤人工确认** — 写盘 / 删除等关键动作前暂停征求同意。
3. **医生可读** — HR、p 值等统计量始终附「人话」解释。

## 运行

```bash
npm install
npm run dev        # 开发服务器（默认 http://localhost:5180）
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

> 提示：`vite.config.js` 用了相对 `base`，`HashRouter` 路由，因此 `npm run build`
> 后的 `dist/index.html` 可直接部署到任意静态目录。

## 关键页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 新建分析 | Hero + 输入框 + 数据/方式/模型上下文控件 + 常见任务 |
| `/session/:id` | **实时工作台**（核心） | 计划复核 → 透明的执行流（推理 / 子任务 / 工具调用 / 审批 / 产物 / 小结）+ 右侧产物·文件·计划面板 + 随时打断的操纵框 |
| `/research` | 我的研究 | 按课题归档的会话列表，搜索与筛选 |
| `/reports` | 图表与报告 | 所有产物的画廊，点开模态预览、可下载 |
| `/skills` | 技能库 | 临床可视化 / 建模 / 数据体检 / 报告等可启用技能 |
| `/scheduled` | 定时随访 | 让分析按节奏自动重跑并提示复核 |
| `/data` | 数据源 | 本地 CSV/Excel（浏览器内真·本地解析）+ 院内 MCP 连接器 |
| `/settings` | 自定义 | 全局指令、权限模式（先问再做 / 自动执行）、联网、默认模型、红线开关 |

## 这是真工具，还是演示？

- **真实可用**：导航、会话 / 设置 / 定时 / 数据源全部持久化到 `localStorage`；
  添加本地 CSV 会在浏览器内真实解析行列；产物可真实导出为 CSV / Markdown 到本机——数据不出域。
- **脚本化模拟**：唯一被「演」出来的是 Agent 的推理与执行流（因为没有真实后端 / LLM）。
  执行节奏、工具调用、审批暂停由 `src/lib/runEngine.js` 这套状态机按剧本（`src/lib/scenarios.js`）回放。
- **示例数据**：内置合成肺癌随访队列（`src/lib/clinicalData.js`），所有数字为演示用，**不构成任何真实临床结论**。

## 代码结构

```
src/
  main.jsx / App.jsx          入口与路由
  index.css                   设计系统（设计令牌、基础样式、动效）
  lib/
    Icon.jsx                  统一线性图标
    store.jsx                 localStorage 持久化的全局状态 + Toast
    seed.js                   初始种子数据（会话 / 定时 / 数据源 / 设置）
    clinicalData.js           合成队列的分析结果（KM / Table1 / Cox）
    scenarios.js              脚本化执行剧本
    runEngine.js              执行引擎状态机（含权限门控）
    exporters.js              本地 CSV / Markdown 导出
  components/
    Sidebar / Dropdown / ArtifactView
    charts/                   KMCurve / BaselineTable / ForestPlot / ReportDoc（自绘 SVG）
    workspace/                PlanCard / StreamEvent / ArtifactPanel
  pages/                      Home / Session / Research / Reports / Skills / Scheduled / DataSources / Settings
reference/
  home-prototype.html         最初的单文件原型（设计参考）
```

—— v0.2 · 单机前端原型
