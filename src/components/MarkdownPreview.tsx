import React from 'react';
import { Check } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  onToggleTask?: (lineIndex: number) => void;
  readOnly?: boolean;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match inline code, bold, italic, strikethrough, and markdown links
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline-${keyCounter++}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[0.875em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      nodes.push(
        <strong key={key} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      nodes.push(
        <del key={key} className="line-through text-zinc-400 dark:text-zinc-500">
          {renderInline(token.slice(2, -2))}
        </del>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2];
        const safeHref =
          href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')
            ? href
            : '#';
        nodes.push(
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  onToggleTask,
  readOnly = false,
}) => {
  if (!content.trim()) {
    return (
      <p className="text-zinc-400 dark:text-zinc-500 italic text-[15px] leading-relaxed">
        Nothing written yet. Switch to Write or Split mode to start drafting.
      </p>
    );
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      const startIndex = i;
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      elements.push(
        <div
          key={`code-${startIndex}`}
          className="my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 overflow-hidden"
        >
          {lang && (
            <div className="px-3.5 py-1.5 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              {lang}
            </div>
          )}
          <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed text-zinc-800 dark:text-zinc-200">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-6 border-t border-zinc-200 dark:border-zinc-800" />
      );
      i += 1;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-3 first:mt-0"
          >
            {renderInline(text)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-2.5 first:mt-0"
          >
            {renderInline(text)}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-5 mb-2 first:mt-0"
          >
            {renderInline(text)}
          </h3>
        );
      }
      i += 1;
      continue;
    }

    // Blockquote (clean hairline surface box, avoiding thick border-l-4 cliché)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      const startIndex = i;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      elements.push(
        <blockquote
          key={`quote-${startIndex}`}
          className="my-4 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 italic text-[15px] leading-relaxed"
        >
          {quoteLines.map((qLine, idx) => (
            <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
              {renderInline(qLine)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Interactive Task List items (- [ ] or - [x])
    if (/^\s*[-*]\s+\[([ xX])\]\s*/.test(line)) {
      const taskItems: { index: number; checked: boolean; text: string }[] = [];
      const startIndex = i;
      while (i < lines.length && /^\s*[-*]\s+\[([ xX])\]\s*/.test(lines[i])) {
        const taskMatch = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s*(.*)$/);
        if (taskMatch) {
          taskItems.push({
            index: i,
            checked: taskMatch[1].toLowerCase() === 'x',
            text: taskMatch[2],
          });
        }
        i += 1;
      }
      elements.push(
        <ul key={`tasks-${startIndex}`} className="my-3 space-y-2">
          {taskItems.map((item) => (
            <li key={item.index} className="flex items-start gap-2.5 group">
              <button
                type="button"
                disabled={readOnly || !onToggleTask}
                onClick={() => onToggleTask?.(item.index)}
                aria-label={item.checked ? 'Mark task incomplete' : 'Mark task complete'}
                className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                  item.checked
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-blue-500'
                } ${!readOnly && onToggleTask ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {item.checked && <Check className="w-3 h-3 stroke-[2.5]" />}
              </button>
              <span
                className={`text-[15px] leading-relaxed transition-colors ${
                  item.checked
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {renderInline(item.text)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      const startIndex = i;
      while (
        i < lines.length &&
        /^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*[-*]\s+\[([ xX])\]/.test(lines[i])
      ) {
        listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i += 1;
      }
      elements.push(
        <ul
          key={`ul-${startIndex}`}
          className="my-3 pl-5 list-disc space-y-1.5 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 marker:text-zinc-400 dark:marker:text-zinc-500"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      const startIndex = i;
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      elements.push(
        <ol
          key={`ol-${startIndex}`}
          className="my-3 pl-5 list-decimal space-y-1.5 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 marker:text-zinc-500 dark:marker:text-zinc-400 marker:font-mono marker:text-xs"
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="my-2.5 text-[15px] leading-[1.7] text-zinc-800 dark:text-zinc-200"
      >
        {renderInline(line)}
      </p>
    );
    i += 1;
  }

  return <div className="max-w-none">{elements}</div>;
};
