(function () {
  'use strict';

  var data = window.DSH_TOUR || {};
  var topics = data.topics || [];
  var stages = data.stages || [];

  var navEl = document.getElementById('topicNav');
  var mainEl = document.getElementById('main');

  /* 「回学习文档」是本地才有的相对路径,部署到服务器上会 404,所以只在 file:// 下显示 */
  (function () {
    var link = document.getElementById('docLink');
    if (link && location.protocol === 'file:') link.hidden = false;
  })();

  /* ------------------------------------------------------------------ *
   * 按 stages 展平成有序列表(侧栏顺序 = 阅读顺序)
   *   - num 只发给 topics 里的正文章节,预备知识页不占编号
   *   - special === 'basics' 表示预备知识页
   * ------------------------------------------------------------------ */
  var byId = {};
  topics.forEach(function (t) { byId[t.id] = t; });

  var flat = [];
  var seq = 0;
  stages.forEach(function (stage) {
    (stage.items || []).forEach(function (item) {
      if (item.kind === 'basics') {
        flat.push({ special: 'basics', meta: item, stage: stage, num: null });
        return;
      }
      var topic = byId[item.id];
      if (topic) {
        seq += 1;
        flat.push({ topic: topic, meta: item, stage: stage, num: seq });
      }
    });
  });
  /* 兜底:stages 没排到的章节,追加到末尾,不至于看不到 */
  topics.forEach(function (t) {
    var listed = flat.some(function (f) { return f.topic && f.topic.id === t.id; });
    if (!listed) {
      seq += 1;
      flat.push({
        topic: t,
        meta: { id: t.id, title: t.title, sub: t.idea, when: '' },
        stage: { label: '未分组', hint: '' },
        num: seq,
      });
    }
  });

  var TOTAL = flat.filter(function (f) { return f.topic; }).length;

  function entryId(entry) {
    return entry.topic ? entry.topic.id : entry.special;
  }

  function indexOfId(id) {
    for (var i = 0; i < flat.length; i++) if (entryId(flat[i]) === id) return i;
    return -1;
  }

  function entryTitle(entry) {
    return entry.meta.title || (entry.topic ? entry.topic.title : '');
  }

  /* ------------------------------------------------------------------ *
   * 已读标记(localStorage,失败也不影响使用)
   * ------------------------------------------------------------------ */
  var READ_KEY = 'dsh-tour-read';

  function readList() {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function isRead(id) {
    return readList().indexOf(id) > -1;
  }
  function toggleRead(id) {
    var list = readList();
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1);
    else list.push(id);
    try { localStorage.setItem(READ_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function readCount() {
    var list = readList();
    return flat.filter(function (f) { return list.indexOf(entryId(f)) > -1; }).length;
  }

  /* ------------------------------------------------------------------ *
   * 极简语法高亮
   * 先分词再转义:保证字符串里的 // 不会被误判成注释,
   * 也不会因为先转义 &quot; 而让字符串正则匹配不到。
   * ------------------------------------------------------------------ */
  var TOKEN_RE = /(\/\/[^\n]*)|(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(const|let|var|function|return|if|else|for|while|do|break|continue|await|async|try|catch|finally|new|throw|typeof|instanceof|class|extends|of|in|import|from|export|default|null|true|false|void|this|switch|case)\b|\b(\d+)\b/g;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlight(code) {
    var out = '';
    var last = 0;
    var m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }

  /* 行内格式:**粗体** 和 `行内代码` */
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="ic">$1</code>');
  }

  /* ------------------------------------------------------------------ *
   * 通用区块渲染(预备知识页用)
   * ------------------------------------------------------------------ */
  function renderBlocks(blocks) {
    return blocks.map(function (b) {
      switch (b.type) {
        case 'h':
          return '<h2 class="basic-h">' + esc(b.text) + '</h2>';
        case 'p':
          return '<p class="basic-p">' + inline(b.text) + '</p>';
        case 'code':
          return '<pre><code>' + highlight(b.code) + '</code></pre>';
        case 'callout':
          return '<div class="basic-callout">' + inline(b.text) + '</div>';
        case 'list':
          var tag = b.ordered ? 'ol' : 'ul';
          return '<' + tag + ' class="basic-list">' +
            b.items.map(function (it) { return '<li>' + inline(it) + '</li>'; }).join('') +
            '</' + tag + '>';
        case 'table':
          return '<table class="basic-table"><thead><tr>' +
            b.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
            '</tr></thead><tbody>' +
            b.rows.map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
            }).join('') +
            '</tbody></table>';
        default:
          return '';
      }
    }).join('');
  }

  /* ------------------------------------------------------------------ *
   * 侧栏:按阶段分组
   * ------------------------------------------------------------------ */
  function renderNav(activeId) {
    var read = readList();
    var html = '';
    var lastStage = null;

    flat.forEach(function (entry) {
      var id = entryId(entry);

      if (entry.stage !== lastStage) {
        lastStage = entry.stage;
        html +=
          '<div class="nav-stage">' +
            '<div class="nav-stage-label">' + esc(entry.stage.label) + '</div>' +
            (entry.stage.hint ? '<div class="nav-stage-hint">' + esc(entry.stage.hint) + '</div>' : '') +
          '</div>';
      }

      var done = read.indexOf(id) > -1;

      html +=
        '<a class="nav-item' + (id === activeId ? ' active' : '') + (done ? ' is-read' : '') +
          '" href="#' + esc(id) + '">' +
          '<span class="nav-idx">' + (entry.num === null ? '起' : entry.num) + '</span>' +
          '<span class="nav-body">' +
            '<span class="nav-title">' + esc(entryTitle(entry)) + '</span>' +
            '<span class="nav-sub">' + esc(entry.meta.sub || '') + '</span>' +
          '</span>' +
          (done ? '<span class="nav-check" title="已读">✓</span>' : '') +
        '</a>';
    });

    navEl.innerHTML = html;

    var bar = document.getElementById('progress');
    if (bar) bar.textContent = '已读 ' + readCount() + ' / ' + flat.length;
  }

  /* ------------------------------------------------------------------ *
   * 翻页 / 已读按钮
   * ------------------------------------------------------------------ */
  function pager(i) {
    var prev = flat[i - 1];
    var next = flat[i + 1];
    var html = '<nav class="pager">';
    if (prev) {
      html += '<a href="#' + esc(entryId(prev)) + '"><span class="dir">← 上一节</span>' +
              esc(entryTitle(prev)) + '</a>';
    } else {
      html += '<span class="spacer"></span>';
    }
    if (next) {
      html += '<a href="#' + esc(entryId(next)) + '" style="text-align:right"><span class="dir">下一节 →</span>' +
              esc(entryTitle(next)) + '</a>';
    } else {
      html += '<a href="#intro" style="text-align:right"><span class="dir">看完了 →</span>回到导览说明</a>';
    }
    return html + '</nav>';
  }

  function readButton(id) {
    var done = isRead(id);
    return '<button class="read-btn' + (done ? ' done' : '') + '" id="readBtn">' +
      (done ? '✓ 已标记为读完(点击取消)' : '标记这节为读完') +
    '</button>';
  }

  function wireReadButton(i) {
    var btn = document.getElementById('readBtn');
    if (!btn) return;
    var id = entryId(flat[i]);
    btn.addEventListener('click', function () {
      toggleRead(id);
      renderNav(currentId());
      render(i);
    });
  }

  function progressLine(entry) {
    var base = entry.num === null
      ? '预备知识'
      : '第 ' + entry.num + ' 节 / 共 ' + TOTAL + ' 节';
    return '<div class="topic-progress">' + base +
      (entry.meta.when ? '<span class="sep">·</span>建议时机:' + esc(entry.meta.when) : '') +
    '</div>';
  }

  /* ------------------------------------------------------------------ *
   * 预备知识页
   * ------------------------------------------------------------------ */
  function renderBasics(i) {
    var entry = flat[i];
    var b = data.basics || { title: '预备知识', sub: '', blocks: [] };
    var id = entryId(entry);

    mainEl.innerHTML =
      '<article class="topic">' +
        progressLine(entry) +
        '<header class="topic-head">' +
          '<h1>' + esc(b.title) + '</h1>' +
          (b.sub ? '<p class="basic-sub">' + inline(b.sub) + '</p>' : '') +
        '</header>' +
        renderBlocks(b.blocks) +
        readButton(id) +
        pager(i) +
      '</article>';

    wireReadButton(i);
  }

  /* ------------------------------------------------------------------ *
   * 源码章节页
   * ------------------------------------------------------------------ */
  function renderTopic(i) {
    var entry = flat[i];
    var topic = entry.topic;
    var id = entryId(entry);

    var notes = '';
    for (var n = 0; n < topic.notes.length; n++) {
      notes +=
        '<div class="note">' +
          '<div class="note-h"><span class="note-i">' + (n + 1) + '</span>' + esc(topic.notes[n].h) + '</div>' +
          '<p>' + esc(topic.notes[n].p) + '</p>' +
        '</div>';
    }

    mainEl.innerHTML =
      '<article class="topic">' +
        progressLine(entry) +
        '<header class="topic-head">' +
          '<h1>' + esc(entryTitle(entry)) + '</h1>' +
          '<div class="chips">' +
            '<span class="chip chip-pkg">' + esc(topic.pkg) + '</span>' +
            '<span class="chip">' + esc(topic.file) + '</span>' +
            '<span class="chip chip-ref">对照学习文档 ' + esc(topic.num) + ' 节</span>' +
          '</div>' +
        '</header>' +

        '<section class="block block-naive">' +
          '<h2>' + esc(topic.naiveLabel) + '</h2>' +
          '<pre><code>' + highlight(topic.naive) + '</code></pre>' +
        '</section>' +

        '<section class="block block-prod">' +
          '<h2>' + esc(topic.prodLabel) + '</h2>' +
          '<pre><code>' + highlight(topic.prod) + '</code></pre>' +
        '</section>' +

        '<section class="notes">' +
          '<h2>这段代码在解决什么</h2>' +
          notes +
        '</section>' +

        '<section class="takeaway">' +
          '<div class="takeaway-label">一句话</div>' +
          '<p>' + esc(topic.takeaway) + '</p>' +
        '</section>' +

        readButton(id) +
        pager(i) +
      '</article>';

    wireReadButton(i);
  }

  function render(i) {
    if (flat[i].special === 'basics') renderBasics(i);
    else renderTopic(i);
  }

  /* ------------------------------------------------------------------ *
   * 导览说明页
   * ------------------------------------------------------------------ */
  function renderIntro() {
    var read = readList();
    var first = flat[0];

    var groups = '';
    stages.forEach(function (stage) {
      var items = '';
      (stage.items || []).forEach(function (item) {
        var i = indexOfId(item.id);
        if (i === -1) return;
        var entry = flat[i];
        var isBasics = entry.special === 'basics';
        items +=
          '<li><a href="#' + esc(item.id) + '">' +
            '<span class="n' + (isBasics ? ' n-start' : '') + '">' +
              (entry.num === null ? '起' : entry.num) +
            '</span>' +
            '<span class="t">' + esc(entryTitle(entry)) +
              '<span class="s">' + esc(item.sub || '') + '</span>' +
            '</span>' +
            '<span class="d">' + esc(item.when || '') + '</span>' +
          '</a></li>';
      });
      if (!items) return;
      groups +=
        '<div class="intro-stage">' +
          '<div class="intro-stage-head">' +
            '<span class="intro-stage-label">' + esc(stage.label) + '</span>' +
            '<span class="intro-stage-hint">' + esc(stage.hint || '') + '</span>' +
          '</div>' +
          '<ul class="intro-list">' + items + '</ul>' +
        '</div>';
    });

    var ctaMain = first && first.special === 'basics'
      ? '先看预备知识(约 10 分钟)→'
      : '从第 1 节开始 →';

    mainEl.innerHTML =
      '<article class="intro">' +
        '<h1>生产级 agent 源码导览</h1>' +
        '<p class="lead">读源码看不懂,通常不是因为代码难,是因为<strong>没有对照物</strong>。' +
        '这里每一节都摆两段代码:一段是你在第 1 周会自己写出来的朴素版,一段是 DeepSeek Harness 在同一个位置的真实做法。</p>' +

        (first
          ? '<a class="cta" href="#' + esc(entryId(first)) + '">' +
              '<span class="cta-main">' + ctaMain + '</span>' +
              '<span class="cta-sub">' + esc(entryTitle(first)) + ' · ' + esc(first.meta.sub || '') + '</span>' +
            '</a>'
          : '') +

        '<div class="intro-grid">' +
          '<div class="intro-card naive">' +
            '<h3>朴素版</h3>' +
            '<p>你 Day 1–7 会写出来的实现。二十行以内,逻辑正确,能跑通。</p>' +
          '</div>' +
          '<div class="intro-card prod">' +
            '<h3>生产版</h3>' +
            '<p>同一个功能,在真实 harness 里的样子。差别不在聪明,在于把失败情况都想到了。</p>' +
          '</div>' +
        '</div>' +

        '<h2 class="intro-h2">按这个顺序看' +
          (readCount() ? '<span class="intro-done">已读 ' + readCount() + ' / ' + flat.length + '</span>' : '') +
        '</h2>' +

        groups +

        '<div class="warnbox">' +
          '<strong>怎么读:</strong>先看两段代码的差别,别看细节。看不出来差别就直接看下面的讲解 —— ' +
          '讲解是按「朴素版漏了什么」组织的,不是逐行解释语法。每节的最后一句话是结论,记住它比记住代码有用。' +
        '</div>' +

        '<div class="warnbox">' +
          '<strong>别一次看完。</strong>上面分了四个阶段,每个阶段对应你学习路线上的一个时间点。' +
          '现在还没写到那一步的,先跳过 —— 没被坑过的时候看,记不住。' +
        '</div>' +

        '<div class="warnbox">' +
          '<strong>来源说明:</strong>代码摘录自本机 <code>@deepseek-ai/</code> 下的编译产物,只做了缩进调整(tab → 2 空格),' +
          '逻辑未改动;都是片段而非完整文件,省略处用 <code>// ...</code> 标出。' +
        '</div>' +
      '</article>';
  }

  /* ------------------------------------------------------------------ *
   * 路由
   * ------------------------------------------------------------------ */
  function currentId() {
    return location.hash.replace(/^#/, '') || 'intro';
  }

  function route() {
    var i = indexOfId(currentId());

    if (i === -1) {
      renderNav(null);
      renderIntro();
    } else {
      renderNav(currentId());
      render(i);
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  /* 键盘左右切换 */
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var i = indexOfId(currentId());
    if (e.key === 'ArrowRight') {
      if (i === -1) { if (flat[0]) location.hash = '#' + entryId(flat[0]); }
      else if (i + 1 < flat.length) location.hash = '#' + entryId(flat[i + 1]);
    } else if (e.key === 'ArrowLeft') {
      if (i > 0) location.hash = '#' + entryId(flat[i - 1]);
      else if (i === 0) location.hash = '#intro';
    }
  });

  route();
})();