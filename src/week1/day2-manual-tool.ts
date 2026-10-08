/**
 * Day 2|手动跑通一次工具调用(不写循环)★ 全周最关键
 *
 * 任务:
 *   1. 定义 1 个工具(建议 read_file,或更简单的 get_time)
 *   2. 第一次请求带上 tools 参数
 *   3. 打印返回的 message,看清 tool_calls 长什么样
 *   4. 你自己去执行这个工具 —— 手写调用,不要用循环
 *   5. 把结果以 { role: 'tool', tool_call_id: call.id, content: ... } 追加进 messages
 *   6. 再发一次请求,看模型怎么用工具结果作答
 *
 * 要观察:
 *   - tool_calls 里有什么:id / function.name / function.arguments
 *   - arguments 是字符串还是对象(这是第 4 个坑)
 *   - 第二次请求时,finish_reason 变成了什么
 *
 * 验收标准:
 *   亲眼看到模型如何用工具结果作答。
 *
 * 为什么这一步最关键:
 *   把循环拆开手动做一遍,你就永远理解 agent 了。
 *   直接抄 AGENT-LEARNING.md 里那 12 行的人,通常会在 Day 3 的报错里卡两天。
 *
 * 做完记得用 dumpMessages(messages) 看一眼完整的消息序列 —— 那就是知识点 ①。
 */

import OpenAI from 'openai';
import { client, MODEL } from '../client.js';
import { dumpMessages } from '../lib/inspect.js';

const messages: OpenAI.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: '你是一个简洁的助手'
  },
  {
    role: 'user',
    content: '深圳天气咋样?'
  },
]

// 工具定义：获取指定城市的天气
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "获取指定城市的天气",
      parameters: {
        type: "object",
        properties: {
          // 查询天气时需要提供位置，因此参数设置为location
          location: {
            type: "string",
            description: "城市名，例如：深圳"
          }
        },
        required: ["location"]
      },
    }
  }
];

const getCurrentWeather = async () => {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    tools,
  })

  console.log("🚀 ~ getCurrentWeather ~ secondResponse:", JSON.stringify(response, null, 2))

  const responseMessage = response.choices[0]?.message;
  if (!responseMessage) throw new Error('模型没返回任何 choice');

  messages.push(responseMessage)
  
  // 解析并执行本地工具
  if (responseMessage.tool_calls) {
    for (const toolCall of responseMessage.tool_calls) {
      const func = JSON.parse(toolCall.function.arguments);

      const resultWeather = {
        ...func,
        condition: "晴天",
      }
      
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultWeather)
      })
    };

    dumpMessages(messages)

  }
  const secondResponse = await client.chat.completions.create({
    model: MODEL,
    messages,
    tools,
  })
  console.log("🚀 ~ getCurrentWeather ~ secondResponse:", JSON.stringify(secondResponse, null, 2))
}

await getCurrentWeather()
