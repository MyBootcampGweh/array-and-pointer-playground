import { ArrowRight } from "lucide-react";

import {
  type CodeToken,
  type CodeTokenKind,
  sliceTokens,
  tokenise,
} from "@/lib/c-syntax";

// MBG's editor mapping: keywords also get weight, so the shape of the program
// reads without relying on colour.
const TOKEN_CLASS: Record<CodeTokenKind, string> = {
  comment: "text-code-comment italic",
  string: "text-code-string",
  number: "text-code-literal",
  type: "text-code-type",
  keyword: "font-medium text-code-keyword",
  function: "text-code-special",
  definition: "text-code-definition",
  plain: "",
};

type CodePanelProps = {
  lines: readonly string[];
  /** Zero-based index of the line being executed. */
  activeLine?: number | null;
  /** Part of the active line to emphasise, such as `i < ukuran_array`. */
  activePart?: string | null;
};

/** A static editor window in MBG's style: title bar, gutter, syntax colours. */
export function CodePanel({
  lines,
  activeLine = null,
  activePart = null,
}: CodePanelProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-elevated ring-1 ring-foreground/10">
      <div className="flex items-center gap-3 border-b bg-muted px-4 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <h2 className="font-mono text-sm text-muted-foreground">
          <span className="sr-only">Kode C, </span>main.c
        </h2>
        <span className="ml-auto rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
          C
        </span>
      </div>
      {/* `relative` keeps the absolutely positioned sr-only text inside the
          scroller; otherwise it escapes and widens the whole page. */}
      <pre className="relative overflow-x-auto py-3 font-mono text-sm leading-8 xl:text-base">
        {/* `min-w-max` stretches every line to the longest one, so the active
            highlight still spans the row after scrolling sideways. */}
        <code className="block min-w-max">
          {lines.map((line, index) => {
            const isActive = index === activeLine;
            return (
              <span
                key={index}
                aria-current={isActive ? "step" : undefined}
                className={`flex border-l-4 pr-4 ${isActive ? "border-active bg-active/10" : "border-transparent"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex w-12 shrink-0 items-center justify-end gap-1 border-r pr-2.5 tabular-nums select-none ${isActive ? "font-semibold text-active" : "text-muted-foreground"}`}
                >
                  {isActive ? <ArrowRight className="size-3.5" /> : null}
                  {index + 1}
                </span>
                <span className="pl-3">
                  {renderLine(line, isActive ? activePart : null)}
                  {isActive ? (
                    <span className="sr-only"> (baris yang lagi jalan)</span>
                  ) : null}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </section>
  );
}

function renderLine(line: string, part: string | null) {
  const tokens = tokenise(line);
  const start = part ? line.indexOf(part) : -1;
  if (!part || start === -1) {
    return renderTokens(tokens);
  }
  const end = start + part.length;
  return (
    <>
      {renderTokens(sliceTokens(tokens, 0, start))}
      {/* A ring, not a fill: tokens then sit on the line's tint alone and
          keep their contrast. */}
      <mark className="rounded-sm bg-transparent px-0.5 text-foreground ring-2 ring-active/60">
        {renderTokens(sliceTokens(tokens, start, end))}
      </mark>
      {renderTokens(sliceTokens(tokens, end, line.length))}
    </>
  );
}

function renderTokens(tokens: readonly CodeToken[]) {
  return tokens.map((token, index) =>
    token.kind === "plain" ? (
      token.text
    ) : (
      <span key={index} className={TOKEN_CLASS[token.kind]}>
        {token.text}
      </span>
    ),
  );
}
