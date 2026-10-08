/**
 * DSH 源码导览 —— 内容数据
 *
 * 每一节的结构都是「朴素版 vs 生产版」:
 *   朴素版 = 你在 agent-learning 第 1 周会自己写出来的实现
 *   生产版 = DeepSeek Harness 在同一个位置的做法(真实代码摘录)
 *
 * 摘录说明:
 *   - 来源是 node_modules 里的编译产物,@deepseek-ai/ 下的各个包
 *   - 只做了「tab 换成两个空格」的缩进调整,没有改动逻辑
 *   - 都是片段,不是完整文件;省略的部分用 // ... 标出
 */
window.DSH_TOUR = {
  /* ------------------------------------------------------------------ *
   * 预备知识 —— 排在所有章节之前
   *
   * 结构:blocks 数组,每个元素是一个块,app.js 按 type 渲染。
   * 支持的 type:h / p / code / callout / list / table
   * ------------------------------------------------------------------ */
  basics: {
    title: "预备知识:读代码前先懂这些",
    sub: "不用背。只有最后一节「值得记住的四条」需要真的记住,其余理解就行,忘了随时回来查。",
    blocks: [
      {
        type: "p",
        text: "下面七节都在对比「你写的代码」和「生产级代码」。要看出差别,你得先知道**一次 LLM 调用里到底发生了什么**。这一页就是那个底子,大约 10 分钟。",
      },

      { type: "h", text: "一、一次 API 调用里到底有什么" },
      {
        type: "p",
        text: "所有 agent 代码,本质上都在操作下面这个数组。看懂它,你就看懂了一半:",
      },
      {
        type: "code",
        code: `[
  { role: "system",    content: "你是一个文件助手" },

  { role: "user",      content: "看看 src 目录里有什么" },

  { role: "assistant", content: null,
    tool_calls: [{
      id: "call_1",
      type: "function",
      function: { name: "list_dir", arguments: '{"path":"src"}' }
    }] },

  { role: "tool",      tool_call_id: "call_1",
    content: '["index.ts","utils.ts"]' },

  { role: "assistant", content: "src 目录下有两个文件:index.ts 和 utils.ts。" }
]`,
      },
      { type: "p", text: "四种角色分别是谁写的、干什么:" },
      {
        type: "table",
        head: ["角色", "谁写的", "作用"],
        rows: [
          ["system", "你", "定身份、规则、边界。每轮都要重发"],
          ["user", "你 / 用户", "任务本身"],
          ["assistant", "模型", "模型说的话。可能带 tool_calls(说要调工具),也可能是最终回答"],
          ["tool", "你的代码", "工具执行结果。必须带 tool_call_id 指回是哪次调用"],
        ],
      },

      { type: "h", text: "二、五个必须理解的概念" },
      {
        type: "list",
        ordered: true,
        items: [
          "**LLM 是一个无状态的函数。** messages 进,message 出。它不记事、不能执行动作、不能联网。所谓「记忆」,就是你每次都把历史重发一遍。",
          "**工具是模型「说」,你「做」。** 模型只输出一个 JSON 说「我想调 list_dir,参数是 xxx」,它完全不碰你的文件。执行权始终在你手里 —— 安全边界也在你手里。",
          "**上下文会累积。** 每一轮都把全部历史发回去。所以「它忘了前面说的话」和「越跑越慢越跑越贵」是同一个原因,不是你写错了。",
          "**token 既是长度也是钱。** 输入和输出都按 token 计费,上下文越长每轮越贵。",
          "**agent 就是循环。** 把上面这些串起来循环,直到模型不再要求调用工具。全部本质就这么多。",
        ],
      },

      { type: "h", text: "三、术语速查(不用背,看到不认识就回来查)" },
      {
        type: "table",
        head: ["术语", "一句话解释"],
        rows: [
          ["system prompt", "放最前面的指令,定角色和规则。每轮都重发,所以越长越贵"],
          ["tool / function call", "模型要求调用某个函数。模型只负责说,执行是你的代码"],
          ["tool_calls", "assistant 消息里装工具调用的数组,一次可能有多个"],
          ["tool_call_id", "每次调用的唯一编号。回填结果时必须对上,否则 API 直接报 400"],
          ["arguments", "工具参数。注意是**字符串**,要 JSON.parse,而且可能是坏 JSON"],
          ["finish_reason", "这轮为什么结束:stop = 说完了;tool_calls = 还要调工具;max-tokens = 被长度截断"],
          ["max steps", "循环次数上限。防止它反复调同一个工具把额度烧完"],
          ["context window", "模型一次最多能看多少 token。超了就得裁剪或摘要"],
          ["streaming / SSE", "流式输出。token 一块块推给前端,做成打字机效果"],
          ["KV cache", "提示缓存。前缀不变才能命中,命中的输入便宜很多"],
          ["schema", "工具参数的格式说明,告诉模型这个工具收哪些参数"],
          ["MCP", "让工具能跨客户端复用的标准协议。第 7 周再学"],
          ["RAG", "检索增强:先从资料库查,再让模型回答。第 5 周再学"],
          ["eval", "评测。用固定用例集跑分,把「感觉还行」变成准确率数字"],
          ["harness", "模型之外的那一圈:循环、工具、上下文、可观测、错误恢复。你正在用的东西"],
        ],
      },

      { type: "h", text: "四、值得记住的四条" },
      {
        type: "p",
        text: "上面三节都可以不背,**只有这四条建议背下来** —— 它们是最高频的踩坑点:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "消息顺序:`system → user → assistant(带 tool_calls)→ tool → assistant`",
          "每条 `tool` 消息必须有 `tool_call_id`,和前面 `tool_calls` 里的 `id` **一一对应**",
          "`arguments` 是**字符串**不是对象,要 `JSON.parse`,且必须防坏 JSON",
          "`tools` 必须**每次请求都带上** —— 模型不会记住你上次给了它什么工具",
        ],
      },
      {
        type: "callout",
        text: "看完这一页,就可以进第 1 节了。看不懂的术语先跳过,在代码里见到再回来查 —— 那时候你会有具体的印象,比现在硬记有用得多。",
      },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 阅读顺序 —— 侧栏按这里分组和排序
   *
   * topics 里放的是「内容」,这里定义的是「怎么读」。
   * 加了新章节,除了往 topics 追加,还要在这里排进阅读顺序。
   * item.kind === "basics" 表示这是预备知识页(不是 topics 里的一节)。
   * ------------------------------------------------------------------ */
  stages: [
    {
      label: "第一步:打底",
      hint: "完全的小白从这里开始,大约 10 分钟",
      items: [
        {
          id: "basics",
          kind: "basics",
          title: "预备知识:读代码前先懂这些",
          sub: "一次 API 调用里到底有什么",
          when: "最开始,先看这个",
        },
      ],
    },
    {
      label: "先看这两节",
      hint: "最简单,也最重要 —— 你写完 Day 3 就能看懂",
      items: [
        {
          id: "loop",
          title: "循环与终止条件",
          sub: "什么时候算「跑完了」",
          when: "写完 Day 3 的循环之后",
        },
        {
          id: "arguments",
          title: "参数解析:把崩溃变成可恢复",
          sub: "模型给了不合法的 JSON 怎么办",
          when: "紧接着上一节看",
        },
      ],
    },
    {
      label: "把循环补完整",
      hint: "Day 4 加了工具之后再看",
      items: [
        {
          id: "tool-schema",
          title: "工具怎么定义:真实写法长什么样",
          sub: "description 和参数该怎么写",
          when: "写完 Day 4 之后",
        },
        {
          id: "parallel",
          title: "一轮要调多个工具,能不能一起跑",
          sub: "并行执行,和它的「安全默认值」",
          when: "Day 4 加了多个工具之后",
        },
      ],
    },
    {
      label: "让它可靠、不烧钱",
      hint: "第 2 周做工程化时再看",
      items: [
        {
          id: "repeat",
          title: "它卡在重复调用里怎么办",
          sub: "提醒,而不是硬停",
          when: "第 2 周做可靠性时",
        },
        {
          id: "pruning",
          title: "上下文太长了怎么办",
          sub: "裁剪工具结果,而不是全砍",
          when: "第 2 周做上下文管理时",
        },
        {
          id: "tokens",
          title: "钱花在哪了:看懂 token 账单",
          sub: "把 token 拆成四个桶",
          when: "第 2 周要优化成本时",
        },
      ],
    },
  ],

  topics: [
    /* ------------------------------------------------------------------ */
    {
      id: "loop",
      num: "③",
      title: "Agent 循环与终止条件",
      pkg: "dsh-agent-loop",
      file: "lib/index.js",
      idea: "什么时候算「跑完了」",
      naiveLabel: "你 Day 3 会写出来的版本",
      naive: `for (let step = 0; step < 10; step++) {
  const res = await client.chat.completions.create({ model, messages, tools });
  const msg = res.choices[0].message;

  messages.push(msg);
  if (!msg.tool_calls?.length) break;   // 不再要工具 = 结束

  for (const call of msg.tool_calls) {
    // 执行工具,把结果回填进 messages
  }
}`,
      prodLabel: "生产级:同一个位置",
      prod: `if (finish.kind === "max-tokens") return { kind: "max-tokens" };

const toolCalls = message.content.filter((block) => block.type === "tool-call");
if (toolCalls.length === 0) return { kind: "completed" };

const { concluded } = await executeToolCalls(
  this.loopCtx, turn, step, toolCalls, signal,
  (context) => this.inbox.splice("next-step", this.inbox.nextStep.length, 0, [context])
);
return concluded ? { kind: "completed" } : null;`,
      notes: [
        {
          h: "它比你多区分了一种情况",
          p: "朴素版把所有「没有 tool_calls」都当成正常结束。生产版先单独拦一次 max-tokens —— 模型是因为输出被截断才没给工具调用,这时候它不是「做完了」,而是「话没说完」。这两种情况必须分开,否则你会把一个被截断的失败当成成功。",
        },
        {
          h: "内容不是字符串,是 block 数组",
          p: "朴素版看的是 msg.tool_calls。生产版是从 message.content 里 filter 出 type === 'tool-call' 的块。也就是说一条消息的内容被建模成结构化的块序列(文本块、工具调用块、思考块…),而不是一坨字符串。这是后面所有能力(流式、多工具、图片)的基础。",
        },
        {
          h: "用返回值表达「继续」,不用 break",
          p: "注意最后一行 return null —— 意思是「这轮没结束,接着跑」。生产级循环把「结束」拆成了好几种状态(completed / max-tokens / null 表示继续),而不是一个 boolean。因为下一步要基于状态做不同的事:落日志、通知用户、或者继续。",
        },
        {
          h: "工具不只是「返回结果」,还要「注入上下文」",
          p: "executeToolCalls 多了一个回调参数,把工具产生的额外上下文塞进下一步的收件箱。也就是说工具执行完,除了结果本身,还可能往对话里追加信息。朴素版没有这个概念 —— 结果就是结果。",
        },
      ],
      takeaway:
        "循环的骨架你写对了。差别在于:生产级把「结束」当成一个有多种取值、需要分类处理的状态机,而不是一个 break。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "arguments",
      num: "坑 4",
      title: "参数解析:把「崩溃」变成「可恢复」",
      pkg: "dsh-agent-loop",
      file: "lib/index.js",
      idea: "模型给了不合法的 JSON 怎么办",
      naiveLabel: "大多数人的第一版",
      naive: `const args = JSON.parse(call.function.arguments);
const result = await runTool(call.function.name, args);`,
      prodLabel: "生产级:同一个位置",
      prod: `/** Parse model arguments, preserving invalid JSON as text and mapping empty input to \`{}\`. */
function parseArguments(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return raw;
  }
}`,
      notes: [
        {
          h: "catch 里不是「处理异常」,是「不抛异常」",
          p: "这一行是整个文件里最值得抄的。常见的写法会在 catch 里记个日志然后 rethrow —— 结果就是一次坏 JSON 让整个 agent 崩掉,用户看到一个报错就没了。这里选择把原始字符串原样返回,让坏参数继续往下走。",
        },
        {
          h: "坏参数会变成一条普通错误,回到模型手里",
          p: "返回值一路传到工具层,工具发现参数不合法,于是产出一条「参数 xxx 不合法」的普通结果。这条结果被回填进对话,模型看到后通常能自己改对。整个过程没有任何异常逃逸出去 —— 一次本来会崩掉的失败,变成了循环里的一次正常纠错。",
        },
        {
          h: "顺手处理了空输入",
          p: "无参数的调用会传空字符串,JSON.parse('') 是抛异常的。这里用 raw ? ... : {} 直接把空输入映射成空对象。这种细节不写不会报错,但会在某个工具上莫名其妙地炸一次。",
        },
      ],
      takeaway:
        "这是「异常兜底」的真正含义:不是把错误记下来,而是让错误变成 agent 能自己消化的一条消息。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tool-schema",
      num: "②",
      title: "工具设计:真实 schema 长什么样",
      pkg: "dsh-tool-fs",
      file: "lib/index.js",
      idea: "description 怎么写,参数怎么定",
      naiveLabel: "你 Day 4 会写出来的版本",
      naive: `const tools = [{
  type: "function",
  function: {
    name: "read_file",
    description: "读文件",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"]
    }
  }
}];`,
      prodLabel: "生产级:同一个位置(已去掉外层包裹)",
      prod: `{
  name: "read",
  description: "Read a UTF-8 text file and return line-numbered content.",
  parameters: {
    file_path: {
      type: "string",
      required: true,
      description: "Path to read, resolved by the filesystem backend."
    },
    offset: {
      type: "number",
      description: "1-based first line to return. Defaults to 1."
    },
    limit: {
      type: "number",
      description: "Maximum number of lines to return. Defaults to 20…"
    }
  },
  isConcurrencySafe: () => true
}`,
      notes: [
        {
          h: "description 里多说了「返回什么」",
          p: "朴素版说「读文件」,模型只知道能读,不知道读出来长什么样。生产版说 return line-numbered content —— 模型提前知道结果会带行号,就不会在后续推理里猜格式、也不会自己再去数行。写清返回格式,比写清功能更有用。",
        },
        {
          h: "offset / limit 不是功能,是上下文控制",
          p: "这是整份材料里最重要的一点。工具被设计成「一次只能返回一段」,所以它在结构上就不可能一次吐十万行回来。事后裁剪是补救,让工具天生返回有界内容才是根治 —— 这两者的差别,就是第 2 周「上下文管理」的核心。",
        },
        {
          h: "每个参数都写明默认值",
          p: "「Defaults to 1」「Defaults to 20…」— 模型不用猜省略时会怎样,也就不会为了「保险」而乱填。参数说明写得越确定,调用行为越稳定。",
        },
        {
          h: "参数声明方式和标准 JSON Schema 不一样",
          p: "注意 required: true 是直接写在字段上的,而不是 JSON Schema 那种独立的 required 数组。说明 harness 有一套自己的参数描述 DSL,在真正发请求前才转成模型要的格式。这样做的好处是工具定义更好写、还能挂额外的元数据(比如下面的 isConcurrencySafe)。",
        },
        {
          h: "多了一个标准里没有的字段:isConcurrencySafe",
          p: "只读工具声明 () => true,表示可以并行执行。写操作不给这个声明。它不是给模型看的,是给调度器看的 —— 下一节会看到这个字段怎么用。",
        },
      ],
      takeaway:
        "工具定义不只是「告诉模型能干什么」,还是「约束模型拿回多少东西」的地方。返回格式、默认值、分页、并发安全,四个都要写。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "pruning",
      num: "④",
      title: "上下文管理:裁剪工具结果",
      pkg: "dsh-compaction-tool-result-pruner",
      file: "lib/index.js",
      idea: "工具返回太长了怎么办",
      naiveLabel: "两种常见的粗暴做法",
      naive: `// 做法一:不管它,上下文越跑越长
messages.push({ role: "tool", tool_call_id: call.id, content: result });

// 做法二:直接砍掉超出部分
messages.push({
  role: "tool",
  tool_call_id: call.id,
  content: result.slice(0, 2000)
});`,
      prodLabel: "生产级:同一个位置",
      prod: `/** Fixed marker substituted for every removed middle span. */
const PRUNE_MARKER = "\\n\\n[... tool result middle pruned ...]\\n\\n";

const DEFAULTS = {
  headChars: 4096,   // 开头保留
  tailChars: 1024    // 结尾保留
};

// ...

const removedStart = this.config.headChars;
const removedEnd = totalChars - this.config.tailChars;`,
      notes: [
        {
          h: "砍中间,留两头",
          p: "朴素版切掉的是结尾。生产版切的是中间:保留开头 4096 字和结尾 1024 字。理由是开头的表头、命令回显、文件前几行通常含有结构性信息,结尾是结果和报错,而中间大段才是可以牺牲的冗余内容。",
        },
        {
          h: "不是删掉,是留一个标记",
          p: "[... tool result middle pruned ...] —— 这一句是给模型看的。它明确告诉模型「这里原本有内容,是被裁掉的」,而不是让模型以为数据本来就不完整、然后在残缺的数据上继续推理。裁剪最大的风险就是让模型产生错误的事实判断,这个标记就是在防它。",
        },
        {
          h: "确定性,不是让模型去摘要",
          p: "整个裁剪是纯字符计算,不调用模型。好处有三个:不花钱、结果可复现、行为可预测。用「让 LLM 总结一下」来压缩上下文听起来聪明,但它会引入新的不确定性和新的成本,而且可能把关键信息总结掉。",
        },
        {
          h: "配置本身也要校验",
          p: "文件里还有一条检查:头 + 标记 + 尾 的长度不能超过触发裁剪的阈值,否则直接报错。因为那样会出现「裁剪完比不裁还长」的荒谬情况。这类边界校验是配置型系统必须做的。",
        },
      ],
      takeaway:
        "上下文管理不是「删东西」,是「在不破坏模型判断的前提下删东西」。留标记这一步,比裁剪本身更重要。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "repeat",
      num: "⑥",
      title: "反复调用的兜底:提醒,而不是硬停",
      pkg: "dsh-repeat-tool-reminder",
      file: "lib/index.js",
      idea: "它反复调同一个工具停不下来",
      naiveLabel: "你 Day 3 会写出来的版本",
      naive: `for (let step = 0; step < 10; step++) {
  // ...
}
// 到 10 步就硬停。
// agent 什么也没完成,你只看到一个失败的结果,
// 而且不知道它到底卡在哪一步、在重复什么。`,
      prodLabel: "生产级:分级提醒(两档文案)",
      prod: `thresholds: z.array(z.number()).default([3, 5, 8]),

// 第一档(第 3 次重复):温和提醒
const GENTLE_REMINDER =
  "You are repeating the exact same tool call with identical arguments. " +
  "Carefully analyze the previous result before calling again: if the task is " +
  "not complete, try a different approach or different arguments instead of " +
  "repeating the call.";

// 第二档(第 5、8 次重复):点名细节
function detailedReminder(toolName, count, canonicalArguments) {
  return \`Repeated tool call detected:
- tool: \${toolName}
- consecutive_calls: \${count}
- arguments: \${canonicalArguments}
The repeated calls are not making progress. Do not call this tool with these
exact arguments again. Inspect the latest result and choose a different
action, different arguments, or finish the task if enough evidence has been
gathered.\`;
}`,
      notes: [
        {
          h: "max steps 是兜底,不是解决方案",
          p: "朴素版的循环上限能防止死循环烧钱,但它什么都没解决 —— 到点就断,任务半途而废。生产版把这个数量上限降级成最后一道保险,真正的解法是「发现它在重复,然后干预」。",
        },
        {
          h: "干预方式是往上下文里插一条提示",
          p: "这是第二次遇到同一个套路了:工具执行完之后,harness 往对话里注入一条 note。上一步是注入工具产生的上下文,这里是注入一条纠错提醒。模型下一次请求时就会看到它,从而改变行为。你不用改写循环逻辑,只要往消息序列里加东西。",
        },
        {
          h: "两档升级,而且阈值可配",
          p: "[3, 5, 8] —— 第 3 次温和提醒,第 5、8 次详细提醒。不是一上来就骂,也不是只提醒一次。这种「渐进式施压」比单次硬规则有效得多,而且阈值做成配置项,不同场景可以调。",
        },
        {
          h: "提示的最后一句给了三条具体出路",
          p: "「换个动作 / 换组参数 / 如果证据已经够了就收尾」。注意它不是简单说「别再重复了」—— 那种否定式指令会让模型陷入新的僵局(不知道该干嘛)。给它明确的备选路径,它才有得选。这是写纠错提示的通用原则。",
        },
        {
          h: "一个隐蔽但关键的处理:参数要先归一化",
          p: "检测「同一个调用」时,不能直接比字符串。模型很可能换个属性顺序输出同样的参数,字符串就不同了,检测直接失效。所以文件里有个 sortJsonValue,把参数对象深度排序之后再比较。这种细节只有真被坑过的人才会补上。",
        },
        {
          h: "连提醒文案里的参数都要截断",
          p: "配置里有一项 argumentsPreviewChars: 500。提醒本身也要占上下文预算,所以在提醒里引用参数时只引用前 500 字。做上下文管理的人,连自己写的提示词都算进预算。",
        },
      ],
      takeaway:
        "这是第 8 节那条纪律最好的例子:agent 犯了「反复调用」这个错,他们没有只加个上限了事,而是工程化地做了一个让它不再犯的机制。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "parallel",
      num: "副作用",
      title: "并行执行与安全默认值",
      pkg: "dsh-tools + dsh-agent-loop",
      file: "lib/index.js",
      idea: "一轮里多个工具,能不能一起跑",
      naiveLabel: "你 Day 4 会写出来的版本",
      naive: `for (const call of msg.tool_calls) {
  const args = JSON.parse(call.function.arguments);
  const result = await runTool(call.function.name, args);
  messages.push({ role: "tool", tool_call_id: call.id, content: result });
}
// 一个接一个,永远是串行的。慢,但至少不会出事。`,
      prodLabel: "生产级:工具自己声明,调度器决定",
      prod: `// ① dsh-tools:工具声明自己能不能并行
executionMode(exec) {
  // ...
  return tool.isConcurrencySafe(exec.arguments) === true
    ? { kind: "parallel" }
    : { kind: "exclusive" };
}

// ② dsh-agent-loop:带并发上限的调度池
while (!aborted && nextToStart < group.length
       && inFlight.size < maxParallelToolCalls) {
  const nextCall = group[nextToStart];
  // 一旦遇到不能并行的工具,后面的就等下一批
  if (nextToStart > 0 && mode === "parallel"
      && ctx.tools.executionMode(nextCall.exec).kind !== "parallel") break;
  await startCall(nextToStart);
  // ...
}`,
      notes: [
        {
          h: "关键在那个 === true",
          p: "只有工具明确返回严格等于 true,才判定为可并行。没声明、声明了非布尔值、抛异常 —— 一律当作 exclusive(串行)。这是典型的「安全默认值」:拿不准的时候选慢的那个,因为选错的代价不对称 —— 串行只是慢,并行出错可能已经把数据写坏了。",
        },
        {
          h: "能不能并行是工具说了算,不是调用方猜",
          p: "调度器不去分析参数、不猜这个工具危不危险,它只读工具自己的声明。这个设计把「安全性」的责任放回了工具作者手里 —— 谁写的工具,谁最清楚它能不能并发。",
        },
        {
          h: "而且可以按参数动态判断",
          p: "注意 isConcurrencySafe 接收 exec.arguments。也就是说同一个工具,读不同文件时可以并行,但某些参数组合下可以变成串行。安全判断的粒度可以细到单次调用。",
        },
        {
          h: "并发有上限,不是全放出去",
          p: "maxParallelToolCalls 限制同时在跑的工具数 —— 不然模型一轮要调 30 个工具,你会瞬间打出 30 个并发请求。有池子、有上限,是并发的基本素养。",
        },
        {
          h: "顺序还要保住",
          p: "文件里的注释写着结果和上下文「commit in model order」—— 并行执行,但按模型给出的顺序提交结果。因为工具结果在消息序列里的顺序不能乱,乱了模型对因果的理解就错了。这是并行执行里最容易被忽略的一条。",
        },
      ],
      takeaway:
        "这就是第 2 周那条「副作用分级」的工业级形态:不是靠约定和自觉,而是写进工具声明和调度器里,让不安全的做法在结构上做不到。",
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tokens",
      num: "⑦",
      title: "可观测:把 token 拆成四个桶",
      pkg: "dsh-token-meter",
      file: "lib/index.js",
      idea: "钱到底花在哪了",
      naiveLabel: "你可能会记的版本",
      naive: `console.log(res.usage);
// { prompt_tokens: 4210, completion_tokens: 380, total_tokens: 4590 }
//
// 你知道这次花了 4590 个 token。
// 但你不知道:这 4210 里有 3800 是每轮都在重发的 system prompt。`,
      prodLabel: "生产级:同一个位置",
      prod: `const emptyBuckets = {
  uncachedInputTokens: 0,   // 没命中缓存的输入(全价)
  outputTokens: 0,          // 输出
  cacheReadTokens: 0,       // 命中缓存读到的(便宜)
  cacheWriteTokens: 0       // 写入缓存的
};

const bucketsFrom = (usage) => ({
  uncachedInputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
  cacheReadTokens: usage.cacheReadTokens ?? 0,
  cacheWriteTokens: usage.cacheWriteTokens ?? 0
});`,
      notes: [
        {
          h: "输入不是一种东西,是三种",
          p: "朴素版只有「输入 token」一个数字。生产版把输入拆成:没命中缓存的、命中缓存读的、写缓存的。因为这三者价格差得很远 —— 命中缓存的输入通常比全价便宜一个数量级。",
        },
        {
          h: "拆开之后你才能发现问题",
          p: "只看总量,你永远不知道钱花在哪。一旦拆开,你会立刻看到类似「我的 cacheReadTokens 一直是 0」—— 意思是提示缓存从来没命中,每轮都在按全价重发整个 system prompt。这是个能省一半钱的问题,但在单一数字的口径下完全不可见。",
        },
        {
          h: "这是优化的度量基础",
          p: "第 2 周要做的「KV cache 前缀优化」,前提就是有 cacheReadTokens 这个口径。没有它,你改了前缀顺序也不知道有没有生效 —— 就退化回「感觉快了」。这正是第 7 个知识点(可观测)存在的意义:让优化可验证。",
        },
        {
          h: "用空桶 + 合并的方式来累加",
          p: "先定义一个各项为 0 的空桶,再从每次的 usage 里取,缺失的字段用 ?? 0 兜底。这样跨不同厂商的 API(有的不返回缓存字段)都能安全累加。多供应商兼容的常见写法。",
        },
      ],
      takeaway:
        "可观测不是「多打几行日志」,是「把口径设计对」。口径错了,数据再多也看不出问题。",
    },
  ],
};