# Array & Pointer Playground

Interactive website that teaches arrays and pointers in C to beginner students,
in Indonesian. Nine modules, each a simulation that runs in the browser. Nothing
here compiles or runs real C, and every memory address is an illustration.

## Run locally

Requires Node.js 22.18 or newer and pnpm (the version is pinned in
`package.json`).

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Check

```bash
pnpm verify     # typecheck, lint, format check, unit tests
pnpm build      # static export to out/
```

To preview the export the way GitHub Pages serves it, from a sub-path:

```bash
PAGES_BASE_PATH=/array-and-pointer-playground pnpm build
mkdir -p preview && cp -r out preview/array-and-pointer-playground
python -m http.server 4173 --directory preview
# open http://localhost:4173/array-and-pointer-playground/
```

A Windows build may log 404s for `__next.*.txt` prefetch files in this local
preview: Next.js 16.4 writes them into nested folders on Windows. The deploy
builds on Linux, where they are written correctly.

## Deploy to GitHub Pages

1. Create the repository on GitHub, add it as `origin`, and push `main`. Keep
   `main` the default branch: by default the `github-pages` environment only
   accepts deployments from the default branch.
2. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions** (one time; no secrets are needed).
3. Every push to `main` runs `.github/workflows/deploy.yml`, which verifies the
   code, builds it with the repository's base path, and publishes `out/`. It
   can also be started by hand from the **Actions** tab (**Run workflow**).

The site is then at `https://<owner>.github.io/<repository>/`. The base path
comes from `actions/configure-pages`, so renaming the repository or adding a
custom domain needs no code change.
