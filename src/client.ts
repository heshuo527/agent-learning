import 'dotenv/config';
import OpenAI from 'openai';

/**
 * LLM 客户端(阿里云百炼 / DashScope)。
 *
 * 这里只做机械的事:读环境变量、建客户端、导出模型名。
 *
 * 百炼提供 OpenAI 兼容接口,所以用的还是官方 openai SDK ——
 * 只是把 baseURL 和模型名换成了百炼的。想换回 DeepSeek 或别家,
 * 改 .env 里这三个变量就够了,这个文件不用动。
 */

const apiKey = process.env.MINIMAX_API_KEY;

if (!apiKey) {
  throw new Error(
    '缺少 DASHSCOPE_API_KEY。请先执行 `cp .env.example .env`,' +
      '然后把百炼控制台「API-KEY 管理」里创建的 key 填进去。',
  );
}

export const client = new OpenAI({
  apiKey,
  /*
   * 百炼的 OpenAI 兼容模式地址。
   * 北京地域用下面这个;新加坡地域换成
   * https://dashscope-intl.aliyuncs.com/compatible-mode/v1
   */
  baseURL:
    process.env.MINIMAX_BASE_URL ??
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

/** 默认用 qwen-plus:工具调用(function calling)稳定,价格适中,适合整个学习周期。 */
export const MODEL = process.env.MINIMAX_MODEL ?? 'qwen-plus';