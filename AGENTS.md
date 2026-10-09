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
  Every new dependency needs a stated reason.
- Simulations never claim to run real C. Addresses are illustrative decimals:
  base 1000, +4 per `int`. An index is a position, not an address.
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
- English code, identifiers and comments; casual, clear Indonesian for all
  user-facing copy.
- Strict TypeScript: no `any`, no `!`, no `as` except `as const` and `Route`;
  model UI states as discriminated unions; `import { type X }` for types; `@/`
  instead of `../../`.
- Comments explain why, never what. JSDoc only for exported `src/lib` functions
  with a non-obvious contract.

## Styling: MBG design system

- Tokens live in `src/app/globals.css` (`@theme`), copied from MBG
  `web/src/app/globals.css` (`C:/Users/Jakson/Workspace/Projects/my-bootcamp-gweh`).
  Use token utilities: no raw hex in components, no arbitrary `[…]` values
  without a justifying comment.
- Roles: index teal, value green, address amber, pointer purple, active indigo,
  out-of-bounds red. Always show the role's word next to its colour.
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
