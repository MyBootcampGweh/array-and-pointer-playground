export type CodeTokenKind = "comment" | "string" | "keyword" | "plain";

export type CodeToken = { kind: CodeTokenKind; text: string };

/** The diagram roles a piece of code can stand for. */
export type CodeRole = "variable" | "index" | "value" | "address" | "pointer";

/**
 * A piece of code that is also something in the diagram, such as the `2` in
 * `nilai[2]`; the editor gives it that thing's role colour.
 */
export type CodePart = string | { text: string; role: CodeRole };
export type CodeLine = string | readonly CodePart[];

/**
 * `int nilai[5];`, or with `values` `int nilai[5] = {10, 20, …};`, with the
 * name marked as the Variable and each initial Value as a Value.
 */
export function arrayDeclaration(
  name: string,
  length: number,
  values?: readonly number[],
): CodePart[] {
  const parts: CodePart[] = ["int ", { text: name, role: "variable" }];
  parts.push(`[${length}]`);
  if (values) {
    parts.push(" = {");
    values.forEach((value, index) => {
      parts.push(...(index > 0 ? [", "] : []), {
        text: String(value),
        role: "value",
      });
    });
    parts.push("}");
  }
  parts.push(";");
  return parts;
}

// Enough C for these snippets, not a parser. Types count as keywords: both
// only get weight, because colour in the editor is kept for the roles.
const KEYWORDS =
  "int|char|float|double|void|long|short|unsigned|signed|const|for|while|do|if|else|return|sizeof|break|continue";

// One alternation scanned left to right: at each position the first group
// that matches wins, so a keyword inside a string stays part of the string.
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/.*|\/\*.*?\*\/)`,
    String.raw`(?<string>"(?:[^"\\]|\\.)*")`,
    String.raw`(?<keyword>\b(?:${KEYWORDS})\b)`,
  ].join("|"),
  "g",
);

/** Splits one line of C into tokens; joining their text gives the line back. */
export function tokenise(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let cursor = 0;
  for (const match of line.matchAll(TOKEN)) {
    if (match.index > cursor) {
      tokens.push({ kind: "plain", text: line.slice(cursor, match.index) });
    }
    const kind = Object.entries(match.groups ?? {}).find(
      ([, text]) => text !== undefined,
    )?.[0];
    tokens.push({ kind: isTokenKind(kind) ? kind : "plain", text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) {
    tokens.push({ kind: "plain", text: line.slice(cursor) });
  }
  return tokens;
}

/** The tokens covering characters `from` to `to`, cut at both ends. */
export function sliceTokens(
  tokens: readonly CodeToken[],
  from: number,
  to: number,
): CodeToken[] {
  const slice: CodeToken[] = [];
  let offset = 0;
  for (const token of tokens) {
    const start = Math.max(from, offset);
    const end = Math.min(to, offset + token.text.length);
    if (start < end) {
      slice.push({
        kind: token.kind,
        text: token.text.slice(start - offset, end - offset),
      });
    }
    offset += token.text.length;
  }
  return slice;
}

const TOKEN_KINDS: readonly string[] = ["comment", "string", "keyword"];

function isTokenKind(name: string | undefined): name is CodeTokenKind {
  return name !== undefined && TOKEN_KINDS.includes(name);
}
