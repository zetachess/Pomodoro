# Pomodoro Timer

An open-source Pomodoro app for turning big tasks into small, focused blocks of work. It is designed to run without an account or backend: your tasks, sessions, and preferences are stored only in your browser's local storage.

![Pomodoro Timer](public/pomodoro-timer.png)

## Features

- Configurable Focus sessions with short and long breaks.
- Task list with editing, completion, and timer linking.
- Session history, focus streaks, weekly insights, and achievements.
- Daily summary that can be copied or shared through WhatsApp.
- Optional browser notifications and sound alerts.
- Responsive design for mobile, tablet, and desktop.
- Spanish interface with no built-in accounts, backend, or analytics.

## Open source

Pomodoro Timer is open-source software released under the [MIT License](LICENSE). Contributions, bug reports, accessibility improvements, and translations are welcome.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Checks before publishing

```bash
npm run lint
npm run build
```

The production build is written to `dist/` and can be served as a static website.

## Architecture

```text
src/
├── App.tsx                 # Main views and application flow
├── types/                  # Domain types and default values
├── hooks/                  # Reusable React persistence hooks
└── utils/
    ├── pomodoro.ts         # Timer calculations and formatting
    └── storage.ts          # Storage keys and persisted-data validation
```

This is a React + TypeScript single-page application built with Vite. It does not make network requests during normal use. WhatsApp sharing and browser notifications are only triggered by explicit user actions.

## Privacy and storage

Data is stored in `localStorage` under these keys:

- `pomogoblin-settings`
- `pomogoblin-tasks`
- `pomogoblin-sessions`
- `pomogoblin-timer`
- `pomogoblin-active-task`

Data is not sent to a server. You can remove everything from **Settings → Delete local data**. Browser storage can be read or modified by code running on the same origin, so do not store passwords, tokens, or other sensitive information in the app.

## Security

See [SECURITY.md](SECURITY.md) for the security model, privacy boundaries, and vulnerability reporting guidance.

## Contributing

1. Fork the repository and create a descriptive branch.
2. Install dependencies with `npm install`.
3. Keep changes focused and explain important product or security decisions.
4. Run `npm run lint` and `npm run build`.
5. Open a pull request describing the problem, solution, and verification steps.

For visual changes, screenshots from desktop and mobile are helpful. Please avoid adding dependencies or telemetry without explaining their privacy and maintenance impact.

## License

Pomodoro Timer is distributed under the MIT License. See [LICENSE](LICENSE).
