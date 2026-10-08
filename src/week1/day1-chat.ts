/**
 * Day 1|裸调一次普通对话
 *
 * 任务:
 *   用 client 发一次最普通的对话请求,不加 tools。
 *   打印出 res.choices[0] 的完整内容。
 *
 * 要观察:
 *   - request 里有哪些字段(model / messages 是必填的)
 *   - response 的结构:choices[0].message、finish_reason、usage
 *   - finish_reason 这一轮是什么值
 *
 * 验收标准:
 *   能说清 request 和 response 的结构。
 *
 * 提示:
 *   把下面两行 import 的注释去掉即可开始。
 */

import OpenAI from 'openai';
import { client, MODEL } from '../client.js';

/* ==================================================================
 * ↓↓↓ 你的代码从这里开始写
 *
 * 怎么运行:在 agent-learning/ 目录下执行     pnpm day1
 * 写完以后:把文件底部那段 console.log 删掉 —— 它是提示文字,不是代码骨架
 * ================================================================== */

const messages : OpenAI.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: '你是一个简洁的助手',
  },
  {
    role: 'user',
    content: '用一句话解释什么是agent',
  }
]

const chatMessages = async (model: string, messages: OpenAI.ChatCompletionMessageParam[]) => {
  const res = await client.chat.completions.create({
    model,
    messages,
  })
  console.log("🚀 ~ chatMessages ~ res:", JSON.stringify(res, null, 2))
}

await chatMessages(MODEL, messages);