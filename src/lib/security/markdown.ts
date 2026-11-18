function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}

function safeUrl(value: string): string | null {
  const url = value.trim();
  if (/^(https?:|mailto:)/i.test(url) || /^(\/|#)/.test(url)) return url;
  return null;
}

function inlineMarkdown(source: string): string {
  let html = escapeHtml(source);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, rawUrl: string) => {
    const url = safeUrl(rawUrl);
    return url ? `<img src="${escapeHtml(url)}" alt="${alt}" />` : alt;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, rawUrl: string) => {
    const url = safeUrl(rawUrl);
    return url ? `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${label}</a>` : label;
  });
  html = html
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  return html;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) output.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      flushParagraph();
      closeList();
      if (code) {
        output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else code = [];
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushParagraph();
      closeList();
      output.push('<hr />');
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const item = /^\s*(?:[-*+]\s+|\d+\.\s+)(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const nextList = /^\s*\d+\.\s+/.test(line) ? 'ol' : 'ul';
      if (list !== nextList) {
        closeList();
        list = nextList;
        output.push(`<${list}>`);
      }
      output.push(`<li>${inlineMarkdown(item[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }

  if (code) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return output.join('\n');
}
