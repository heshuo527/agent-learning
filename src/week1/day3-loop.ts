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
const executeTool = (name: string, args: { location: string }) => {
  if (name !== "get_current_weather") {
    throw new Error(`没有名为${name}名字的工具`);
  }
  if (!args?.location) {
    throw new Error(`缺少必要 location 参数`);
  }
  return {
    location: args.location,
    condition: args.location.includes("北京") ? "多云" : "下雨",
    temperature: "33度"
  }
}

const MAX_STEPS = 5;

// 获取指定城市天气
const runAgent = async () => {
  for (let setup = 1; setup <= MAX_STEPS; setup++) {
    console.log(`---- 第${setup}轮Agent思考---- `);
    const started = Date.now();
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
    })

    logUsage(setup, response.usage, Date.now() - started)

    const choice = response.choices?.[0];
    if (!choice) {
      console.log(`当前模型没有返回任何结果`);
      return;
    }
    messages.push(choice.message);

    // 对话结束
    if (choice.finish_reason === "stop") {
      console.log(`当前模型对话结束: ${choice.message.content}`);
      dumpMessages(messages);
      return;
    }

    // 对话超出长度被截取
    if (choice.finish_reason === "length") {
      console.log(`当前对话超出最大长度, 请调大max_token`);
      return;
    }

    // 调用工具
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        let content: string;
        try {
          const args = JSON.parse(toolCall.function.arguments)
          const name = toolCall.function.name
          content = JSON.stringify(executeTool(name, args))
        } catch (error) {
          content = `工具执行失败: ${error instanceof Error ? error.message : String(error)}`
        }
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content,
        });
      }
      continue;
    }

    console.log(`没有出现预期的 finish_reason: ${choice.finish_reason}`);
    return;
  }

  console.log(`对话达到最高次数 ${MAX_STEPS}，仍未结束`);
  dumpMessages(messages);
}

await runAgent();