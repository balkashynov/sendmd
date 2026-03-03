# sendmd

Drop a markdown file, paste, or start typing — get a shareable link in seconds.

## Features

- **Live preview** — side-by-side editor with instant markdown rendering
- **Formatting toolbar + shortcuts** — CMD+B, CMD+I, CMD+K, headings, lists, code, and more
- **Drag & drop** — drop `.md` or `.txt` files straight into the editor
- **Share links** — one-click shareable URLs with configurable expiry (1h, 24h, 7d, 30d)
- **Export** — download as `.md`, `.txt`, or `.pdf`
- **Reading mode** — distraction-free full-width view
- **Dark mode** — system-aware with manual toggle
- **Draft persistence** — survives refresh and tabs via session/local storage

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 14, React 18, Tailwind CSS, react-markdown, remark-gfm |
| Backend | Express, PostgreSQL, AWS S3 (R2) |
| Monorepo | pnpm workspaces, TypeScript |

## Getting Started

```bash
pnpm install
```

### Environment

Create `packages/backend/.env`:

```
DATABASE_URL=postgres://...
BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT_URL=...
AWS_REGION=auto
```

### Database

```bash
pnpm --filter @sendmd/backend migrate
```

### Development

```bash
pnpm dev
```

Runs backend on `:3001` and frontend on `:3000` concurrently.

### Build

```bash
pnpm build
```

## Project Structure

```
packages/
  backend/     Express API — upload, retrieve, delete docs
  frontend/    Next.js app — editor, viewer, sharing
  shared/      TypeScript types shared across packages
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | CMD+B |
| Italic | CMD+I |
| Inline code | CMD+E |
| Link | CMD+K |
| Strikethrough | CMD+Shift+X |
| Heading (cycle) | CMD+Shift+H |
| Blockquote | CMD+Shift+. |
| Unordered list | CMD+Shift+8 |
| Ordered list | CMD+Shift+7 |
| Open file | CMD+O |
| Paste | CMD+V |

## License

MIT
