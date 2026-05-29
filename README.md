# Taskly

Taskly is a modern daily task and reminder web app built with HTML, CSS, and JavaScript.
It is designed as a small professional portfolio project with attention to usability,
client-side security, and clean incremental development.

## Features

- Add, edit, complete, and delete daily tasks.
- Add optional descriptions and priority levels.
- Filter by status and priority.
- Search tasks by title or description.
- View summary stats for total, pending, completed, and high-priority tasks.
- Enable browser reminder notifications when supported.
- Persist tasks locally with `localStorage`.

## Security Notes

This project intentionally includes basic browser-side security practices:

- Uses a Content Security Policy to restrict scripts, styles, connections, objects, and form actions.
- Renders task data with DOM APIs and `textContent` instead of injecting user input with `innerHTML`.
- Normalizes saved `localStorage` data before rendering it.
- Limits task title and description lengths.
- Uses `no-referrer` to avoid leaking page context through referrer headers.
- Avoids external dependencies and third-party scripts in the current static version.

More details:

- [Security Policy](SECURITY.md)
- [Threat Model](docs/THREAT_MODEL.md)

## Run Locally

Start a local static server from the project folder:

```bash
python3 -m http.server 4173
```

Then open:

```txt
http://localhost:4173
```

Using `localhost` is recommended for browser notification support.

## Portfolio Focus

Taskly is a beginner-friendly productivity app with a cybersecurity-aware implementation.
Future improvements can include authentication, server-side storage, automated tests,
and deployment security headers.
