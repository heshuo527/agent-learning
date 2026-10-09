/**
 * 把 .md 文档预渲染成静态 HTML,供部署到服务器上阅读。
 *
 * 为什么要预渲染:
 *   直接把 .md 放上 nginx,浏览器会当成纯文本下载,手机上没法看。
 *   预渲染成静态 HTML 之后运行时零依赖,也不需要服务端做任何事。
 *
 * 用法:node scripts/build-docs.mjs
 * 产物:docs-dist/
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs-dist');

/* ------------------------------------------------------------------ *
 * 要渲染哪些文档
 * ------------------------------------------------------------------ */
const DOCS = [
  {
    src: 'INTERVIEW.md',
    out: 'interview.html',
    title: 'Agent 开发面试题',
    sub: '23 道题 + 答题要点 + 手写题检查表',
  },
  {
    src: 'AGENT-LEARNING.md',
    out: 'learning.html',
    title: 'Agent 学习路线',
    sub: '心智模型 / 七个知识点 / 7 个坑 / 第 1–8 周 / Harness Engineering',
  },
  {
    src: 'README.md',
    out: 'readme.html',
    title: '工作区说明',
    sub: '怎么用这个学习工作区',
  },
];

/* ------------------------------------------------------------------ *
 * GitHub 兼容的标题锚点
 *
 * 文档里的目录是自己写死的锚点(如 #8-harness-engineering2026-的新范式),
 * 必须生成出完全一致的 id,否则点击目录跳不过去。
 * 规则:转小写 → 去掉非「字母/数字/空格/连字符」→ 空格变连字符
 * ------------------------------------------------------------------ */
function slugify(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

/** 给所有标题补上 id */
function addHeadingIds(html) {
  return html.replace(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
    const id = slugify(inner);
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

/* ------------------------------------------------------------------ *
 * 链接改写:文档之间互相引用的是 .md,渲染后要指向 .html
 * ------------------------------------------------------------------ */
const LINK_MAP = {
  'INTERVIEW.md': 'interview.html',
  'AGENT-LEARNING.md': 'learning.html',
  'README.md': 'readme.html',
  './INTERVIEW.md': 'interview.html',
  './AGENT-LEARNING.md': 'learning.html',
  './README.md': 'readme.html',
  'dsh-source-tour/index.html': '/dsh-source-tour/',
  'dsh-source-tour/': '/dsh-source-tour/',
};

function rewriteLinks(html) {
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    if (LINK_MAP[href]) return `href="${LINK_MAP[href]}"`;
    // 源码导览目录下的其他文件,统一指到导览首页
    if (href.startsWith('dsh-source-tour/')) return `href="/dsh-source-tour/"`;
    return m;
  });
}

/* ------------------------------------------------------------------ *
 * 页面模板(配色沿用 dsh-source-tour,保持视觉一致)
 * ------------------------------------------------------------------ */
function page({ title, body, active }) {
  const nav = [
    ['index.html', '首页'],
    ['interview.html', '面试题'],
    ['learning.html', '学习路线'],
    ['readme.html', '工作区说明'],
    ['/dsh-source-tour/', '源码导览'],
  ]
    .map(([href, label]) => {
      const isActive =
        (active === 'interview.html' && href === 'interview.html') ||
        (active === 'learning.html' && href === 'learning.html') ||
        (active === 'readme.html' && href === 'readme.html') ||
        (active === 'index.html' && href === 'index.html');
      return `<a href="${href}"${isActive ? ' class="on"' : ''}>${label}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
:root {
  --bg: #0e1014; --bg-side: #13161c; --bg-card: #171b22; --bg-code: #0b0d11;
  --line: #262c36; --text: #d8dee9; --dim: #8a94a4; --dim2: #5f6875;
  --accent: #6fb1ff; --naive: #e8b96a; --prod: #6ddba0; --warn: #ff9d6b;
  --str: #95e6cb;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 15px/1.75 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
header {
  position: sticky; top: 0; z-index: 10;
  background: rgba(14,16,20,.92); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.hd { max-width: 900px; margin: 0 auto; padding: 12px 22px; display: flex;
      align-items: center; gap: 8px; flex-wrap: wrap; }
.hd .brand { font-weight: 700; font-size: 14px; margin-right: 10px; color: var(--text); }
.hd a { color: var(--dim); text-decoration: none; font-size: 13px;
        padding: 5px 11px; border-radius: 7px; }
.hd a:hover { background: var(--bg-card); color: var(--text); }
.hd a.on { background: #1e2735; color: var(--accent); }
main { max-width: 900px; margin: 0 auto; padding: 34px 22px 120px; }
footer { max-width: 900px; margin: 0 auto; padding: 0 22px 60px;
         color: var(--dim2); font-size: 12.5px; }

h1 { font-size: 30px; line-height: 1.3; margin: 0 0 22px; }
h2 { font-size: 21px; margin: 46px 0 16px; padding-top: 14px;
     border-top: 1px solid var(--line); }
h3 { font-size: 16.5px; margin: 32px 0 12px; color: #cfd8e5; }
h4 { font-size: 15px; margin: 24px 0 10px; color: var(--dim); }
p { margin: 0 0 15px; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
strong { color: #eef3fa; }
hr { border: 0; border-top: 1px solid var(--line); margin: 38px 0; }
ul, ol { padding-left: 24px; margin: 0 0 16px; }
li { margin-bottom: 7px; }
li input[type=checkbox] { margin-right: 6px; accent-color: var(--prod); }

blockquote {
  margin: 0 0 18px; padding: 13px 18px; background: #16202c;
  border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0;
  color: #a8bdd6; font-size: 14.5px;
}
blockquote p:last-child { margin-bottom: 0; }

code {
  background: #1c2029; border: 1px solid var(--line); border-radius: 4px;
  padding: 1px 6px; font-size: 12.5px; color: var(--str);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  word-break: break-word;
}
pre {
  background: var(--bg-code); border: 1px solid var(--line); border-radius: 10px;
  padding: 15px 18px; overflow-x: auto; margin: 0 0 20px;
}
pre code {
  background: none; border: 0; padding: 0; color: #c8d2e0;
  font-size: 12.5px; line-height: 1.65; white-space: pre;
}

table {
  width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 13.5px;
  display: block; overflow-x: auto;
}
th, td { border: 1px solid var(--line); padding: 9px 13px; text-align: left;
         vertical-align: top; line-height: 1.6; }
th { background: #1a1f27; color: var(--text); font-weight: 600; white-space: nowrap; }
td { color: #b9c2cf; }
tr:hover td { background: #161a21; }

/* 首页卡片 */
.cards { display: grid; gap: 14px; margin-top: 26px; }
.card {
  display: block; background: var(--bg-card); border: 1px solid var(--line);
  border-radius: 11px; padding: 18px 22px; text-decoration: none; color: var(--text);
  transition: border-color .12s, background .12s;
}
.card:hover { border-color: #3a4451; background: #1c2029; text-decoration: none; }
.card .t { font-size: 16.5px; font-weight: 700; }
.card .s { display: block; font-size: 13px; color: var(--dim); margin-top: 5px; }
.card .n { font-size: 11.5px; color: var(--dim2); margin-top: 8px; }

@media (max-width: 620px) {
  h1 { font-size: 24px; }
  h2 { font-size: 18.5px; }
  main { padding: 24px 16px 90px; }
  .hd { padding: 10px 16px; }
  table { font-size: 12.5px; }
}
</style>
</head>
<body>
<header><div class="hd"><span class="brand">Agent 学习</span>${nav}</div></header>
<main>${body}</main>
<footer>由 INTERVIEW.md / AGENT-LEARNING.md 自动生成 · 改文档后重新执行 <code>node scripts/build-docs.mjs</code></footer>
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * 构建
 * ------------------------------------------------------------------ */
marked.setOptions({ gfm: true, breaks: false });

mkdirSync(OUT, { recursive: true });

const built = [];

for (const doc of DOCS) {
  const md = readFileSync(join(ROOT, doc.src), 'utf8');
  let html = marked.parse(md);
  html = addHeadingIds(html);
  html = rewriteLinks(html);

  writeFileSync(
    join(OUT, doc.out),
    page({ title: `${doc.title} · Agent 学习`, body: html, active: doc.out }),
    'utf8',
  );

  built.push({ ...doc, html, bytes: Buffer.byteLength(html) });
  console.log(`  ✅ ${doc.src.padEnd(22)} → ${doc.out.padEnd(16)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

/* 首页 */
const indexBody = `
<h1>Agent 学习资料</h1>
<p>从零手写 agent 内核的学习记录,以及配套的面试准备材料。</p>
<div class="cards">
${DOCS.map(
  (d) =>
    `  <a class="card" href="${d.out}"><span class="t">${d.title}</span><span class="s">${d.sub}</span><span class="n">${d.src}</span></a>`,
).join('\n')}
  <a class="card" href="/dsh-source-tour/"><span class="t">生产级源码导览</span><span class="s">朴素版 vs 生产版:7 处关键代码对照 + 预备知识</span><span class="n">dsh-source-tour/</span></a>
</div>`;
writeFileSync(
  join(OUT, 'index.html'),
  page({ title: 'Agent 学习资料', body: indexBody, active: 'index.html' }),
  'utf8',
);
console.log(`  ✅ ${'index(生成)'.padEnd(22)} → index.html`);

/* ------------------------------------------------------------------ *
 * 自检:目录锚点必须都能跳到
 *
 * 文档里的目录是手写锚点,渲染后 id 对不上就会「点了没反应」。
 * 这类问题自己在浏览器里一个个点很费劲,所以让脚本直接报出来。
 * ------------------------------------------------------------------ */
console.log('\n锚点自检:');
let broken = 0;
for (const doc of built) {
  const ids = new Set();
  for (const m of doc.html.matchAll(/<h[1-6] id="([^"]*)"/g)) ids.add(m[1]);

  const bad = [];
  for (const m of doc.html.matchAll(/href="#([^"]+)"/g)) {
    const raw = m[1];
    /*
     * marked 会把中文 href 做 percent 编码(#1-%E5%BF%83...),
     * 而浏览器在匹配 id 之前会先解码,所以这里也要解码后再比,
     * 否则会把「其实能跳」的锚点误报成失效。
     */
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      /* 解不开就用原值比 */
    }
    if (!ids.has(raw) && !ids.has(decoded)) bad.push(raw);
  }

  if (bad.length) {
    broken += bad.length;
    console.log(`  ❌ ${doc.out}: ${bad.length} 个锚点跳不到`);
    bad.slice(0, 5).forEach((b) => console.log(`       #${b}`));
  } else {
    const n = [...doc.html.matchAll(/href="#/g)].length;
    console.log(`  ✅ ${doc.out}: ${n} 个锚点全部有效(标题 id 共 ${ids.size} 个)`);
  }
}

console.log(`\n产物目录: docs-dist/`);
if (broken) {
  console.log(`⚠️  有 ${broken} 个锚点失效 —— 检查 slugify 规则是否和文档里的写法一致`);
  process.exit(1);
}