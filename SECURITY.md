# Security Policy

Taskly is a static client-side portfolio project. It does not currently collect,
transmit, or store user data on a server. Task data is stored locally in the
user's browser with `localStorage`.

## Supported Version

The `main` branch is the actively maintained version.

## Reporting a Vulnerability

If you find a security issue, please open a GitHub issue with:

- A clear description of the issue.
- Steps to reproduce it.
- The expected and actual behavior.
- Browser and operating system details.

Please do not include real sensitive data in reports.

## Security Scope

In scope:

- Cross-site scripting risks from task title or description input.
- Unsafe rendering of locally stored task data.
- Browser permission handling for notifications.
- Client-side data validation and normalization.

Out of scope for the current static version:

- Server authentication issues.
- Database authorization issues.
- API rate limiting.
- Account takeover scenarios.

These areas will become relevant if Taskly is later upgraded to include a
backend, authentication, or shared cloud storage.

## Current Security Controls

- Content Security Policy in `index.html`.
- `no-referrer` policy.
- No third-party scripts or external dependencies.
- DOM-based rendering with `textContent` for user-controlled values.
- `localStorage` normalization before rendering.
- Input length limits for task title and description.
- Defensive error handling around browser storage and notifications.
