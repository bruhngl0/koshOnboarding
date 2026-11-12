This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Link to Kōsh Operations

Confirming an applicant in `/admin` creates (or refreshes) their subscriber in
Kōsh Operations (`kosh-main`, `/subscribers`). Set:

| Variable | Value |
| --- | --- |
| `KOSH_OPS_URL` | Operations base URL, e.g. `https://kosh.vercel.app` |
| `KOSH_OPS_SYNC_TOKEN` | Shared secret — must equal `ONBOARDING_SYNC_TOKEN` in kosh-main |

The sync runs as a `subscriber-sync` job (BullMQ with Redis, otherwise the
database queue, processed after the response via `after()`). Bad tokens and
invalid data fail immediately; network and 5xx errors retry. **⇄ Sync confirmed
to Ops** in the admin re-sends every confirmed applicant — use it once after
setting the variables, and whenever a sync failed. Operations upserts on the
submission id, so repeats never duplicate.
