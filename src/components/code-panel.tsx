import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";

import { ROLE_TEXT } from "@/components/ui";
import {
  type CodeLine,
  type CodePart,
  type CodeRole,
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

const ROLE_UNDERLINE: Record<CodeRole, string> = {
  variable: "decoration-variable",
  index: "decoration-index",
  value: "decoration-memory",
  address: "decoration-address",
  pointer: "decoration-pointer",
};

type CodePanelProps = {
  lines: readonly CodeLine[];
  /** Zero-based index of the line being executed. */
  activeLine?: number | null;
  /** Part of the active line to ring, such as `i < ukuran_array`. */
  activePart?: string | null;
};

/** A static editor window in MBG's style: title bar, gutter, syntax colours. */
export function CodePanel({
  lines,
  activeLine = null,
  activePart = null,
}: CodePanelProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-subtle ring-1 ring-foreground/10">
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
                className={`flex border-l-4 pr-4 ${isActive ? "border-foreground/70 bg-muted" : "border-transparent"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex w-12 shrink-0 items-center justify-end gap-1 border-r pr-2.5 tabular-nums select-none ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}
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

function partText(part: CodePart): string {
  return typeof part === "string" ? part : part.text;
}

/**
 * Syntax colours come from the whole line, so a token split across parts
 * still reads right; role parts and the ringed part are cut out of it.
 */
function renderLine(line: CodeLine, ringed: string | null): ReactNode {
  const parts = typeof line === "string" ? [line] : line;
  const text = parts.map(partText).join("");
  const tokens = tokenise(text);

  const roles: { from: number; to: number; role: CodeRole }[] = [];
  let offset = 0;
  for (const part of parts) {
    const length = partText(part).length;
    if (typeof part !== "string") {
      roles.push({ from: offset, to: offset + length, role: part.role });
    }
    offset += length;
  }

  const ringStart = ringed ? text.indexOf(ringed) : -1;
  const ring =
    ringed && ringStart !== -1
      ? { from: ringStart, to: ringStart + ringed.length }
      : null;

  const cuts = new Set([0, text.length]);
  for (const { from, to } of [...roles, ...(ring ? [ring] : [])]) {
    cuts.add(from);
    cuts.add(to);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const pieces = points.slice(1).map((to, i) => {
    const from = points[i] ?? 0;
    const role = roles.find((r) => r.from <= from && from < r.to)?.role;
    const slice = text.slice(from, to);
    const node = role ? (
      <span
        key={from}
        className={`font-semibold underline decoration-2 underline-offset-4 ${ROLE_TEXT[role]} ${ROLE_UNDERLINE[role]}`}
      >
        {slice}
      </span>
    ) : (
      <span key={from}>{renderTokens(sliceTokens(tokens, from, to))}</span>
    );
    return { from, to, node };
  });

  if (!ring) {
    return pieces.map(({ node }) => node);
  }
  return (
    <>
      {pieces.filter((p) => p.to <= ring.from).map(({ node }) => node)}
      {/* A ring, not a fill: tokens keep the line's contrast. */}
      <mark className="rounded-sm bg-transparent px-0.5 text-foreground ring-2 ring-foreground/35">
        {pieces
          .filter((p) => p.from >= ring.from && p.to <= ring.to)
          .map(({ node }) => node)}
      </mark>
      {pieces.filter((p) => p.from >= ring.to).map(({ node }) => node)}
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
