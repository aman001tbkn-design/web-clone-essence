import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) parts.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    else parts.push(<em key={i++} className="text-muted-foreground">{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

const SimpleMarkdown = ({ content, className }: SimpleMarkdownProps) => {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="list-disc pl-5 space-y-1">
          {list.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
    if (ordered.length) {
      blocks.push(
        <ol key={blocks.length} className="list-decimal pl-5 space-y-1">
          {ordered.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ol>,
      );
      ordered = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^\s*[-•]\s+/.test(line)) {
      if (ordered.length) flush();
      list.push(line.replace(/^\s*[-•]\s+/, ""));
      return;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (list.length) flush();
      ordered.push(line.replace(/^\s*\d+\.\s+/, ""));
      return;
    }
    flush();
    if (!line.trim()) return;
    if (line.startsWith("# ")) {
      blocks.push(
        <h3 key={idx} className="text-lg font-semibold text-foreground">
          {line.slice(2)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h4 key={idx} className="font-semibold text-foreground mt-2">
          {line.slice(3)}
        </h4>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={idx} className="border-l-2 border-accent pl-3 text-muted-foreground">
          {inline(line.slice(2))}
        </blockquote>,
      );
    } else {
      blocks.push(<p key={idx}>{inline(line)}</p>);
    }
  });
  flush();

  return (
    <div className={cn("space-y-2 text-sm leading-relaxed text-foreground", className)}>
      {blocks.map((b, i) => (
        <Fragment key={i}>{b}</Fragment>
      ))}
    </div>
  );
};

export default SimpleMarkdown;
