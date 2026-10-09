export type CodeTokenKind =
  | "comment"
  | "string"
  | "number"
  | "type"
  | "keyword"
  | "function"
  | "definition"
  | "plain";

export type CodeToken = { kind: CodeTokenKind; text: string };

// Enough C to read like MBG's editor does for these snippets, not a parser.
const TYPES = "int|char|float|double|void|long|short|unsigned|signed|const";
const KEYWORDS = "for|while|do|if|else|return|sizeof|break|continue";

// One alternation scanned left to right: at each position the first group
// that matches wins, so a keyword inside a string stays part of the string.
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/.*|\/\*.*?\*\/)`,
    String.raw`(?<string>"(?:[^"\\]|\\.)*")`,
    String.raw`(?<number>\b\d+\b)`,
    String.raw`(?<type>\b(?:${TYPES})\b)`,
    String.raw`(?<keyword>\b(?:${KEYWORDS})\b)`,
    String.raw`(?<function>\b[A-Za-z_]\w*(?=\s*\())`,
    String.raw`(?<definition>(?<=\b(?:${TYPES})\s+\**\s*)[A-Za-z_]\w*)`,
  ].join("|"),
  "g",
);

/** Splits one line of C into coloured tokens; joining their text gives the line back. */
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

const TOKEN_KINDS: readonly string[] = [
  "comment",
  "string",
  "number",
  "type",
  "keyword",
  "function",
  "definition",
];

function isTokenKind(name: string | undefined): name is CodeTokenKind {
  return name !== undefined && TOKEN_KINDS.includes(name);
}
