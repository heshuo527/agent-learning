/**
 * Day 3|把 Day 2 改成循环
 *
 * 任务:
 *   把 Day 2 的手动流程改成一个 for 循环。三样东西缺一不可:
 *     - 终止条件:finish_reason === 'stop',或者没有 tool_calls
 *     - 最大步数:必须有,否则它会反复调同一个工具,安静地烧完你的额度
 *     - 异常兜底:工具执行失败时,把错误信息作为结果回填给模型
 *
 * 要观察:
 *   - 循环跑了几轮才停
 *   - 每一轮的 total_tokens 是怎么涨的
 *   - 如果你故意把 max steps 设成 1,会发生什么
 *
 * 验收标准:
 *   循环能自己跑完并正确终止。
 *
 * 注意:
 *   异常兜底不是"打个日志就完事"。
 *   把报错文本作为 tool 结果回填给模型,它通常能自己改对参数 —— 这才是重点。
 */

import OpenAI from 'openai';
import { client, MODEL } from '../client.js';
import { dumpMessages, logUsage } from '../lib/inspect.js';

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

// 工具函数映射
const executeTool = (name: string, args: any) => {
  console.log('argsss', args);
  
  if (name === "get_current_weather") {
    // 模拟不同城市查出的天气结果
    return {
      location: args.location,
      condition: args.location.includes("北京") ? "多云" : "下雨",
      temperature: "33度"
    }
  }
}


// 获取指定城市天气
const getCurrentWeather = async (maxSetup = 5) => {
  let setup = 0;
  const started = Date.now();

  while (maxSetup > setup) {
    setup ++;

    console.log(`---- 第${setup}轮Agent思考---- `);
    
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
    })
    if (!response.choices || response.choices?.length === 0) {
      console.log("当前没有对话");
      return;
    }
    // 讲对话内容插入对话上下文
    messages.push(response.choices[0]!.message)
    // 是否需要调用工具
    if (response.choices[0].finish_reason === 'tool_calls') {
      try {
        for (const choices of response.choices) {
          const tempResponse = response.choices[0]?.message
          logUsage(setup, tempResponse.usage, Date.now() - started)
          // 解析并执行本地工具
          for (const toolCall of choices.message.tool_calls) {
            const func = toolCall.function;
            const args = JSON.parse(func.arguments)
            const toolPramas = executeTool(func.name, args)
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolPramas)
            })
          }
          dumpMessages(messages)
        }
      } catch (error) {
        
      }
    } else {
      console.log("对话结果：", JSON.stringify(response, null, 2))
      return;
    }
  }
}

await getCurrentWeather();