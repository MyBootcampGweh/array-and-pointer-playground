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
- Role terms are English and capitalised, always: Index, Value, Address,
  Memory and Pointer; "array" stays lowercase. A variable is the Indonesian
  "variabel" ("Variabel" as a label). Never write `indeks`, `nilai` or `alamat`
  as words; C identifiers in code, such as the array `nilai`, are fine.
- Module page: the title, its analogy ("Bayangin aja", one sentence) right
  below it, then the workspace. No question, legend row or quiz.
- Workspace (`ModuleFrame` + `Workspace`): full width, a compact header and an
  outline next-module link. A sticky control bar: Ulangi Simulasi,
  Sebelumnya, Putar/Jeda (Putar Ulang at the end) and Berikutnya. From `lg`
  up `SplitView` gives full-height panes with 20px padding, each scrolling on
  its own, and a 1px divider (default 50/50, 30–70, remembered per viewer).
  Left, the compact "Atur …" editor (`program-editor.tsx`, open by default,
  folded away only by its Sembunyikan pengaturan toggle) above the code; a
  name sits beside its initial Value ("Value awal"), and a Value the run
  assigns later ("Value baru (*ptr = …)") is labelled apart;
  right, one card with the narration, the picture, a large expression with
  its result (`nilai[2] → 78`), a small Output and, only for a caveat, a
  one-line footnote. On a phone: code, card, then the editor.
- Each module's program is one definition in `src/lib` that generates both
  the code and the run's snapshots; `useSimulation` holds it. Fields apply on
  Enter or blur, and only an accepted change restarts the run (paused, typed
  input cleared); Pulihkan Contoh brings back the example. scanf pauses the
  run until the student answers in the terminal; an answer is part of the
  run's history, and changing one drops the answers after it.
- Memory is drawn by `memory-diagram.tsx` (Module 1 draws its own strip):
  rows Variabel, Index, Value, Address; whatever holds an Address (a pointer,
  `&x`, a loop counter) sits in a row under the column it points at, with an
  arrow up, passing through empty cells of the rows above. Boxes are neutral:
  dashed before their declaration runs, a grey outline for the box about to
  be used, the role colour only on the box (and its Index and Address) being
  read or written. Pending states get words, not a bare `?`: "Deklarasi belum
  dijalankan." in the empty row under the boxes, "? artinya belum diisi."
  for a declared but unset Value, and a muted expression with "Belum
  dievaluasi" (or "Deklarasi Pointer belum dijalankan.") before it runs.
  Nothing is drawn across columns; a mark that changes column slides there.
- Icons come from `lucide-react`, `aria-hidden` beside a word; an icon-only
  control keeps an sr-only name. Stepping always goes through `useStepper`
  and the control bar.
- Code always goes through `CodePanel` (MBG's editor frame); never style a
  snippet by hand. Mark the parts that are also in the diagram with their role
  (`CodePart`) so code and picture share colours. Keywords are violet and
  strings fuchsia, hues no role uses.

## Styling: MBG design system

- Tokens live in `src/app/globals.css` (`@theme`), copied from MBG
  `web/src/app/globals.css` (`C:/Users/Jakson/Workspace/Projects/my-bootcamp-gweh`).
  Use token utilities: no raw hex in components, no arbitrary `[…]` values
  without a justifying comment.
- Light and dark: every colour token has a value on `:root` and on
  `:root[data-theme="dark"]`, and new ones need both, at AA in both. Use
  `dark:` only for swaps such as the theme icon.
- Roles use the project palette: Variabel blue `#3478F6`, Index red
  `#E53935`, Memory (Value) green `#2EAD67`, Address orange `#F28C28`, Pointer
  yellow `#D9A800`. The base colour fills, borders and draws arrows; text uses
  the role's `-ink` token, since most bases miss AA as text on white. The
  active element is the stronger form of its own role colour, not a separate
  hue. Out-of-bounds is MBG's destructive red with a dashed box and a warning
  icon. Always show the role's word next to its colour.
- Animate only through `motion-safe:`, plain transitions, or the Web
  Animations API behind a `prefers-reduced-motion` check; keep the global
  reduced-motion rule. No animation library. Prettier sorts Tailwind classes.

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
