# Agent 学习工作区

这个文件夹是「学 agent 开发」的独立工作区,包含学习文档 + 可运行的练习脚手架。

## 目录结构

```
agent-learning/
├── AGENT-LEARNING.md        # 主学习文档:知识点 / 第 1–8 周路线 / 避坑 / 报错速查 / Harness Engineering / Demo 记录
├── INTERVIEW.md             # ★ 面试题:概念 / 工具调用 / 循环 / 评测 / 手写题 / 反问环节
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
| `pnpm docs` | scripts/build-docs.mjs | 把 .md 渲染成静态 HTML 到 `docs-dist/` |
| `pnpm docs:deploy` | scripts/deploy-docs.sh | 构建 + 部署到服务器 + 验证 |

## 在线看

文档已经渲染成静态站点部署在服务器上,手机也能看:

| 地址 | 内容 |
|---|---|
| **http://47.94.202.248:3333/docs/** | 文档首页 |
| `…/docs/interview.html` | 面试题 |
| `…/docs/learning.html` | 学习路线 |
| http://47.94.202.248:3333/dsh-source-tour/ | 生产级源码导览 |

`.md` 直接放服务器上浏览器会当纯文本下载,所以用 `pnpm docs` **预渲染成 HTML** 再传。渲染脚本会自检文档里所有目录锚点是否都能跳转,锚点失效会直接报错退出。

改完文档后一条命令更新:

```bash
pnpm docs:deploy
```

## 准备面试

看 `INTERVIEW.md`。它按面试实际环节组织(概念题 → 工具调用 → 循环可靠性 → 流式 → 评测 → 手写题 → 反问)。

**用法不是背题**,是自测:每题先自己答一遍,再看「面试官想听什么」和「危险回答」对答案。

里面标 ⬜ 的题目是第 2~4 周才学的内容,现在答不出来是正常的。文件末尾有一张**就绪度自检清单**,可以对照自己到了哪一步。