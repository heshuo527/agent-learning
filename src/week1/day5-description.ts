/**
 * Day 5|故意把 description 写烂,看它怎么误用
 *
 * 这是一个「实验」,不是「开发」。别跳过 —— 被模型误用工具坑一次,
 * 你对工具设计的理解会超过大部分只看教程的人。
 *
 * 任务:
 *   准备两个工具,职责故意重叠,description 故意写得含糊。比如:
 *     - toolA: description = "处理数据"
 *     - toolB: description = "处理数据"
 *
 *   拿同一个问题问它 5 次,记录它选错了几次。
 *
 *   然后把 description 改清楚(写清「什么时候该用」和「什么时候不该用」),
 *   再问同样 5 次,对比结果。
 *
 * 要观察:
 *   - description 含糊时,它的选择是随机的还是有规律地错
 *   - 参数说明写不清楚时,它会不会编造参数值
 *
 * 验收标准:
 *   能说出 description 写得不好会导致什么具体故障(自测题第 3 题)。
 *
 * 结论要写进 AGENT-LEARNING.md 第 9 节 —— 这就是你的第一份实验数据。
 */

// import { client, MODEL } from '../client.js';

console.log(`
Day 5|工具描述实验

本文件还没有实现。任务见文件头的注释。

这是一个对照实验,请记录两组数据:
  A 组:description 含糊  -> 选错 ?/5
  B 组:description 清楚  -> 选错 ?/5

description 是写给模型看的 prompt,不是写给人看的注释。
`);