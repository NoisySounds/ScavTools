# ScavTools — Frontend

The web interface for ScavTools, a developer utilities platform built with **Next.js** and **Tailwind CSS**. It provides a dashboard of everyday developer tools in a single, clean interface.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** JWT with refresh token flow
- **Fonts:** Geist (Vercel)

## Tools

- Address Shortener (StarkNet wallet addresses)
- Base64 Encoder / Decoder
- Box Shadow Generator
- Code Snippet Saver
- Hash Generator
- JSON Formatter
- JWT Decoder
- PDF Generator
- Regex Tester
- StarkNet Reader
- Uptime Monitor
- Web Screenshot Tool

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tests

Unit tests for the helpers in `lib/` run on Vitest with a jsdom environment.

```bash
cd frontend
npm install
npm test
```

Use `npm run test:watch` while developing and `npm run test:cov` for a coverage report.

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/       # Main tools dashboard
│   ├── login/           # Auth page
│   ├── contact/         # Contact form
│   ├── privacy/         # Privacy policy
│   └── terms/           # Terms of use
├── components/
│   ├── tools/           # Individual tool components
│   └── ui/              # Reusable shadcn/ui components
├── hooks/               # Custom React hooks
└── lib/                 # Utilities
```

## Related

- [Backend](../backend) — NestJS API (auth, tool logging, PDF generation, address shortener)
- [Contract](../contract) — StarkNet smart contracts

## License

MIT