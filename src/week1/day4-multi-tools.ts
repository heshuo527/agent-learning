/**
 * Day 4|加多个工具,让模型自己选
 *
 * 任务:
 *   在第 3 天的循环基础上,加第 2、3 个工具。建议:
 *     - read_file(path)
 *     - list_dir(path)
 *     - get_time()
 *
 *   然后给它一个必须组合多个工具才能完成的任务,比如:
 *     "看看 src 目录下有哪些文件,挑一个读一下,告诉我它是干什么的"
 *
 * 要观察:
 *   - 它是怎么决定先调哪个的
 *   - 一次 assistant 消息里会不会同时出现多个 tool_calls(第 5 个坑)
 *   - 你有没有把所有 tool_calls 都执行完再发下一次请求
 *
 * 验收标准:
 *   模型能自己选对工具,且多工具同时返回时不会漏执行。
 */

import OpenAI from 'openai';
import { client, MODEL } from '../client.js';
import { dumpMessages } from '../lib/inspect.js';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

/** 只允许访问这个目录下的文件。模型给的路径一律限制在它里面。 */
const BASE_DIR = resolve('/Users/zhangyinlei/heshuo/agent-learning');

/** 单个工具结果最多回填这么多字符,防止一个大文件把上下文吃光 */
const MAX_CHARS = 2000;

/** 把模型给的路径解析成绝对路径,并确保没跑到 BASE_DIR 外面 */
function safePath(p: string): string {
  const abs = resolve(BASE_DIR, p);
  const rel = relative(BASE_DIR, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`路径越界:${p} 不在允许目录内`);
  }
  return abs;
}
 
const messages: OpenAI.ChatCompletionMessageParam[] = [
  { role: "system", content: "you are a concice tool assistant" },
  { role: "user", content: "看看 src 目录下有哪些文件,挑一个读一下,告诉我它是干什么的" }
]

const ALLOWED = ["get_time", "get_current_weather", "read_file", "list_dir"];

// 定义工具文件
const tools: OpenAI.ChatCompletionTool[] = [
  {
    function: {
      name: "get_time",
      description: "获取指定城市的时间",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "指定城市的时间，例如：北京"
          },
        },
        required: ['location']
      },
    },
    type: "function" 
  },
  {
    function: {
      name: "get_current_weather",
      description: "获取指定城市的天气",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "查询指定的城市天气，例如：上海"
          },
        },
        required: ["location"]
      }
    },
    type: "function",
  },
  {
    function: {
      name: "read_file",
      description: "查看文件.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "查询指定目录下或者随机的文件内容"
          },
        },
        required: ["path"],
      },
    },
    type: "function"
  },
  {
    function: {
      name: "list_dir",
      description: "查询列表目录",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "查询 /Users/zhangyinlei/heshuo/agent-learning/src 这个目录下的文件"
          },
        },
        required: ["path"],
      },
    },
    type: "function",
  }
]

// 工具函数映射
function executeTool(name: string, args: {location?: string, path?: string}) {
  if (!ALLOWED.includes(name)) {
    throw new Error(`需要调用的：${name}工具不存在。`)
  }

  if (name == "get_time") {
    return {
      location: args.location,
      time: "2026年10月9日 下午14:22",
      zone: "UTC+8"
    }
  }

  if (name == "get_current_weather") {
    return {
      location: args.location,
      condition: "台风",
      temperature: "27度"
    }
  }

  if (name == "read_file") {
    if (!args?.path) throw new Error('read_file 缺少 path 参数');
    const raw = readFileSync(safePath(args.path), 'utf8');
    const tooLong = raw.length > MAX_CHARS;
    return {
      path: args.path,
      chars: raw.length,
      truncated: tooLong,
      content: tooLong
        ? raw.slice(0, MAX_CHARS) + `\n…(已截断,共 ${raw.length} 字符)`
        : raw,
    };
  }

  if (name == "list_dir") {
    if (!args?.path) throw new Error('list_dir 缺少 path 参数');
    const entries = readdirSync(safePath(args.path), { withFileTypes: true }).map((e) =>
      e.isDirectory() ? e.name + '/' : e.name,
    );
    return { path: args.path, count: entries.length, entries };
  }
}

const MAX_STEPS = 5;

async function runAgent() {
  for (let setup = 1; setup <= MAX_STEPS; setup++) {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools
    })
  
    const choice = res.choices?.[0];
    if (!choice?.message) {
      console.log("当前模型没有返回任何结果");
      return;
    }
    console.log("🚀 ~ runAgent ~ choice:", JSON.stringify(res, null, 2))
    messages.push(choice?.message)
    if (choice.finish_reason === "stop") {
      console.log(`当前对话已经结束,对话内容: ${choice?.message.content}`);
      return;
    }
    if (choice.finish_reason === 'length') {
      console.log(`当前对话超出最大长度，请设置token_max`);
      return;
    }
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      for (const call of choice.message.tool_calls) {
        let content = null;
        try {
          const name = call.function.name;
          const args = JSON.parse(call.function.arguments);
          content = JSON.stringify(executeTool(name, args as {location?: string, path?: string}))
          console.log("最终content:::", content)
        } catch (error) {
          content = error instanceof Error ? error.message : String(error);
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: content,
        })
      }
      continue;
    }
    console.log(`没有出现预期的finish_reason，请检查`);
    return;
  }
  console.log(`当前对话数达到最高 ${MAX_STEPS} 次，对话任未结束`);
  dumpMessages(messages);
}


await runAgent()