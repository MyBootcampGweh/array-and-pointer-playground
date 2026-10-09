<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Array & Pointer Playground

Interactive, Indonesian-language website that teaches arrays and pointers in C
to beginners: nine modules, each a browser-only simulation. Static export,
deployed to GitHub Pages.

## Commands

- `pnpm dev`: local dev server
- `pnpm verify`: typecheck + lint + format check + unit tests; run it before
  handing work back
- `pnpm build`: static export to `out/`
- `pnpm format`: apply Prettier
- Pages preview: `PAGES_BASE_PATH=/array-and-pointer-playground pnpm build`,
  then serve `out/` under that sub-path (see `README.md`)

## Hard constraints

- `output: "export"`. Not available: Server Actions, route handlers that read
  the request, proxy, redirects/rewrites/headers, cookies, ISR, the default
  `next/image` loader. Dynamic routes need `generateStaticParams`.
- The base path is injected at build time through `PAGES_BASE_PATH`. Navigate
  with `next/link`; never hard-code `/`-rooted URLs to files in `public/`.
- No backend, database, auth, external APIs, analytics or state libraries.
  Every new dependency needs a stated reason; the one UI dependency is
  `lucide-react`, for icons.
- Simulations never claim to run real C. Addresses are illustrative decimals:
  base 1000, +4 per `int`. An Index is a position, not an Address.
  Out-of-bounds access is never shown as safe.

## Structure

- `src/app/modul/<n>/page.tsx`: Server Component holding the module's static
  copy; the interactive `<topic>-demo.tsx` Client Component sits next to it.
- `src/components/`: UI used by two or more modules.
- `src/lib/`: pure TypeScript (no React, no `@/` imports, erasable syntax only)
  with colocated `*.test.ts`, run directly by `node --test`.

## Conventions

- Server Components by default; put `"use client"` on the interactive leaf,
  never on a page.
- kebab-case files, PascalCase components, `useX` hooks, `handleX` handlers and
  `onX` props.
- English code, identifiers and comments; Indonesian for all user-facing copy
  (see below).
- Strict TypeScript: no `any`, no `!`, no `as` except `as const` and `Route`;
  model UI states as discriminated unions; `import { type X }` for types; `@/`
  instead of `../../`.
- Comments explain why, never what. JSDoc only for exported `src/lib` functions
  with a non-obvious contract.

## Copy and visuals

- Visuals carry the explanation; text only labels, nudges and confirms. If a
  diagram can show it, draw it; otherwise one short sentence, not a paragraph.
- Narration is one sentence (a warning may take two) with at most two
  `RoleChip`s. It says why, not what the picture already shows.
- Write Indonesian the way a Gen Z college student talks to a friend: `kamu`,
  `nggak`, `udah`, `pakai`, `terus`, `kayak`, `buat`. Simple words; nothing
  formal, academic or generated-sounding (`adalah`, `merupakan`, `tidak`,
  `pengguna`, `dengan demikian`). Keep real C terms such as undefined behavior.
- Role terms are English and capitalised, always: Index, Value, Address, plus
  Variable, Memory and Pointer. Never write `indeks`, `nilai` or `alamat` as
  words; C identifiers in code, such as the array `nilai`, are fine.
- Module page: the title, its analogy ("Bayangin aja", one or two sentences)
  right below it, then the stage. No question, legend row or quiz.
- Stage: code on the left with `DataEditor` under it, open by default; on the
  right one card with a one-line hint, the diagram, its controls, the
  narration and, only for a caveat, a short footnote. On a phone the card comes
  before the editor.
- Memory is always drawn by `memory-diagram.tsx`: rows Variable, Index, Value,
  Address; whatever holds an Address (a pointer, `&x`, a loop counter) sits in
  a row under the column it points at, with an arrow up. Nothing is drawn
  across columns. Reveal detail on interaction, not up front.
- Icons come from `lucide-react`, `aria-hidden` beside a word; an icon-only
  control keeps an sr-only name. Stepping always goes through `StepControls`.
- Code always goes through `CodePanel` (MBG's editor frame, greyscale syntax);
  never style a snippet by hand. Colour in code only ever marks a role: mark
  the parts that are also in the diagram with their role (`CodePart`) so code
  and picture share colours.

## Styling: MBG design system

- Tokens live in `src/app/globals.css` (`@theme`), copied from MBG
  `web/src/app/globals.css` (`C:/Users/Jakson/Workspace/Projects/my-bootcamp-gweh`).
  Use token utilities: no raw hex in components, no arbitrary `[…]` values
  without a justifying comment.
- Light and dark: every colour token has a value on `:root` and on
  `:root[data-theme="dark"]`, and new ones need both, at AA in both. Use
  `dark:` only for swaps such as the theme icon.
- Roles use the project palette: Variable blue `#3478F6`, Index red
  `#E53935`, Memory (Value) green `#2EAD67`, Address orange `#F28C28`, Pointer
  yellow `#D9A800`. The base colour fills, borders and draws arrows; text uses
  the role's `-ink` token, since most bases miss AA as text on white. The
  active element is the stronger form of its own role colour, not a separate
  hue. Out-of-bounds is MBG's destructive red with a dashed box and a warning
  icon. Always show the role's word next to its colour.
- Animate only through `motion-safe:` or plain transitions; keep the global
  reduced-motion rule. Prettier sorts Tailwind classes.

## Accessibility

- `lang="id"`, landmarks, one `h1` per page; buttons act, links navigate; every
  input has a label.
- Errors: `aria-invalid` + `aria-describedby` + `role="alert"`. Step narration
  in `aria-live="polite"`; the current module link has `aria-current="page"`.
- Visible focus; main controls at least 44px; WCAG AA contrast; usable at 320px
  with no horizontal page scroll.

## Workflow

- Make the smallest coherent change, then review your own diff for unrelated
  edits.
- Run `pnpm verify` and `pnpm build`; report real results, including failures
  and skipped checks.
- Never stage or commit. End each task with suggested Conventional Commit
  messages, for example `feat(modul-3): add looping output simulation`.
