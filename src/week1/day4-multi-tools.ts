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

// import { client, MODEL } from '../client.js';
// import { dumpMessages } from '../lib/inspect.js';
 
console.log(`
Day 4|加多个工具,让模型自己选

本文件还没有实现。任务见文件头的注释。

最容易出的 bug:
  一条 assistant 消息里有 2 个 tool_calls,你只执行了第 1 个。
  -> 下次请求直接 400。

正确做法:遍历全部 tool_calls,全部回填完,再发下一次请求。
`);