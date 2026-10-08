/**
 * 调试小工具。
 *
 * 学 agent 的核心动作就是「盯着 messages 看」。
 * 模型看到的全部世界就是这个数组 —— 它表现不对,一定是这个数组有问题。
 * 所以先给自己一个能把 messages 打印成人能看懂的样子的小工具。
 */

interface ToolCallLike {
  id: string;
  function: { name: string; arguments: string };
}

interface MessageLike {
  role?: string;
  content?: unknown;
  tool_calls?: ToolCallLike[];
  tool_call_id?: string;
  /**
   * 推理模型(deepseek-v4.1-flash、qwen-plus 等)的思考过程。
   * 注意:它不是标准 OpenAI 字段,DeepSeek / 百炼会在 message 上额外返回。
   */
  reasoning_content?: string | null;
  name?: string;
}

export function truncate(text: string, max = 300): string {
  return text.length <= max ? text : `${text.slice(0, max)}…(共 ${text.length} 字符)`;
}

function toText(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text: unknown }).text);
        }
        return JSON.stringify(part);
      })
      .join('');
  }
  return JSON.stringify(content);
}

/**
 * 检查 tool_calls 和 tool 消息的配对情况。
 *
 * 这个检查是踩坑之后加的:如果忘了把 assistant 消息(带 tool_calls)推进 messages,
 * 模型会以为工具从没被调用过,于是反复调用同一个工具 —— 而且**不报错**。
 * 把这类错误变成看得见的告警,它就不可能再静默发生。
 */
function checkPairing(messages: MessageLike[]): void {
  const declared = new Set<string>(); // assistant 声明过的 tool_call id
  const answered = new Set<string>(); // tool 消息回填过的 id
  const orphans: string[] = []; // 回填了,但前面没人声明过 —— 一定是错的

  messages.forEach((msg, index) => {
    if (msg.tool_calls?.length) {
      for (const call of msg.tool_calls) declared.add(call.id);
    }
    if (msg.tool_call_id) {
      answered.add(msg.tool_call_id);
      if (!declared.has(msg.tool_call_id)) {
        orphans.push(`[${index}] ${msg.tool_call_id}`);
      }
    }
  });

  const pending = Array.from(declared).filter((id) => !answered.has(id));

  console.log('\n----- 配对检查 -----');

  if (orphans.length) {
    console.log(`  ❌ ${orphans.length} 条 tool 消息找不到对应的 tool_calls:`);
    orphans.forEach((o) => console.log(`       ${o}`));
    console.log('     原因:漏了把 assistant 消息(带 tool_calls)push 进 messages。');
    console.log('     后果:模型以为工具没调用过,会反复调用 —— 而且不报错。');
  } else if (declared.size === 0) {
    console.log('  (还没有任何工具调用)');
  } else {
    console.log(`  ✅ ${answered.size} 条 tool 消息的 id 都能对上`);
  }

  if (pending.length) {
    console.log(`  ⏳ ${pending.length} 个 tool_call 还没回填结果:`);
    pending.forEach((p) => console.log(`       ${p}`));
    console.log('     刚发完第一次请求时这是正常的(还没执行工具)。');
  }
}

/**
 * 把 messages 数组打印成人能看的样子。
 * 每天写完请求后调一次,你会比看教程更快理解 agent。
 */
export function dumpMessages(messages: MessageLike[]): void {
  console.log(`\n===== messages(${messages.length} 条)=====`);

  messages.forEach((msg, index) => {
    console.log(`\n[${index}] role = ${msg.role}`);

    if (msg.tool_call_id) {
      console.log(`    tool_call_id = ${msg.tool_call_id}`);
    }

    // content 为空也要显示 —— 「这一轮没说内容、只调了工具」本身就是有用信息
    const text = toText(msg.content);
    console.log(`    content = ${text ? truncate(text) : '(空 —— 只调工具,没说话)'}`);

    // 推理模型的思考。它不算 content,但占 token、也算钱
    if (msg.reasoning_content) {
      console.log(`    reasoning = ${truncate(msg.reasoning_content)}`);
    }

    if (msg.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        console.log(`    tool_call  id = ${call.id}`);
        console.log(`               name = ${call.function.name}`);
        // 标出类型:要观察的就是「它是字符串,不是对象」
        console.log(
          `          arguments = (${typeof call.function.arguments}) ${truncate(call.function.arguments, 200)}`,
        );
      }
    }
  });

  checkPairing(messages);

  console.log('\n===== messages end =====\n');
}

/** 打印一轮的用量。第 7 个知识点(可观测)从这里开始。 */
export function logUsage(
  step: number,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined,
  ms: number,
): void {
  console.log('_____1111', usage);
  
  if (!usage) return;
  console.log(
    `  [step ${step}] ${ms}ms  ` +
      `prompt=${usage.prompt_tokens ?? '?'}  ` +
      `completion=${usage.completion_tokens ?? '?'}  ` +
      `total=${usage.total_tokens ?? '?'}`,
  );
}