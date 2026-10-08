/**
 * Day 6|流式输出 + 一个简单页面
 *
 * 任务:
 *   1. 起一个 http 服务(用 node:http 就够,不用装框架)
 *   2. 提供一个 SSE 接口,把模型的输出一块一块推给前端
 *   3. 配一个极简 html 页面,能看到打字机效果
 *   4. 把工具调用的过程也显示出来(比如"正在读取 xxx 文件…")
 *
 * 要观察:
 *   - stream: true 之后,chunk 的 delta 结构和非流式有什么不同
 *   - ★ tool_calls 是分片到达的:delta.tool_calls[i].function.arguments
 *     一段一段来,必须用 index 累加拼接,拼完才能 JSON.parse
 *
 * 验收标准:
 *   页面上能看到打字机效果,且工具调用过程可见。
 *
 * 为什么重要:
 *   这是你的主场。用户看不到 agent 在干什么,就会觉得它卡死了。
 *   后端出身的 AI 工程师普遍不做这一块,这是你的差异化。
 */

console.log(`
Day 6|流式输出 + 一个简单页面

本文件还没有实现。任务见文件头的注释。

流式下最经典的坑:
  tool_calls 的 arguments 是分片到达的,直接 JSON.parse 会炸。
  要按 delta.tool_calls[i].index 累加拼接,收到 finish_reason 再解析。
`);