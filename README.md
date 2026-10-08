# Agent 学习工作区

这个文件夹是「学 agent 开发」的独立工作区,包含学习文档 + 可运行的练习脚手架。

## 目录结构

```
agent-learning/
├── AGENT-LEARNING.md        # 主学习文档:知识点 / 第 1–8 周路线 / 避坑 / 报错速查 / Harness Engineering / Demo 记录
├── README.md                # 本文件:怎么用这个工作区
├── package.json             # 依赖与每日脚本
├── tsconfig.json
├── .env.example             # 环境变量模板(复制成 .env)
├── src/
│   ├── client.ts            # LLM 客户端(已写好,直接用)
│   ├── lib/
│   │   └── inspect.ts       # 打印 messages / 步骤日志的小工具
│   └── week1/
│       ├── day1-chat.ts         # 裸调对话
│       ├── day2-manual-tool.ts  # 手动跑通工具调用 ★
│       ├── day3-loop.ts         # 改成循环
│       ├── day4-multi-tools.ts  # 多工具选择
│       ├── day5-description.ts  # 工具描述实验
│       ├── day6-stream.ts       # 流式输出 + 前端
│       └── day7-review.md       # 复盘与自测
├── dsh-source-tour/         # ★ 生产级源码对照讲解(双击 index.html 打开)
└── demos/                   # 做成的 demo 代码放这里
```

## 快速开始

```bash
cd agent-learning
pnpm install

cp .env.example .env
# 编辑 .env,填上百炼 API Key(百炼控制台 → API-KEY 管理)

pnpm day1        # 从第一天开始
```

## 每天怎么用

1. 打开 `AGENT-LEARNING.md` 第 4.2 节,看当天那一行
2. 打开 `src/week1/dayN-*.ts`,文件头的注释就是当天的任务和验收标准
3. **自己写实现**,别抄
4. 做完在 `AGENT-LEARNING.md` 第 4.7 节打勾,并把过程记到第 9 节

## 为什么脚手架里没有 agent 代码

`src/client.ts` 和 `src/lib/inspect.ts` 只做了两件机械的事:初始化客户端、把 messages 打印得可读。

**agent 循环本身一行都没写** —— 那是你要学的东西。直接抄一遍能跑通,但 Day 3 一旦报错你会完全不知道发生了什么。

## 每天的脚本

| 命令 | 文件 | 主题 |
|---|---|---|
| `pnpm day1` | day1-chat.ts | 裸调一次对话,看清 request / response |
| `pnpm day2` | day2-manual-tool.ts | 手动跑通一次工具调用(不写循环) |
| `pnpm day3` | day3-loop.ts | 改成循环 + max steps + 异常兜底 |
| `pnpm day4` | day4-multi-tools.ts | 加多个工具,让模型自己选 |
| `pnpm day5` | day5-description.ts | 故意写烂 description,看它怎么误用 |
| `pnpm day6` | day6-stream.ts | 流式输出 + 一个简单页面 |
| `pnpm typecheck` | — | 类型检查 |