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

## Deploy to GitHub Pages

1. Push the repository to GitHub on the `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which verifies the
   code, builds it with the repository's base path, and publishes `out/`.

The base path comes from `actions/configure-pages`, so renaming the repository
or adding a custom domain needs no code change.
