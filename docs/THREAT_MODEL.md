# Taskly Threat Model

## System Overview

Taskly is a browser-based daily task manager built with static HTML, CSS, and
JavaScript. It stores tasks locally in the user's browser and does not use a
backend service in the current version.

## Assets

- Task titles and descriptions.
- Reminder times.
- Completion status and priority metadata.
- Browser notification permission state.
- Project integrity as a portfolio artifact.

## Trust Boundaries

- User input enters through the task form and search field.
- Saved task data enters from `localStorage`.
- Notification permissions are controlled by the browser.
- The app runs entirely in the browser origin where it is opened.

## Main Threats

### Stored XSS Through Task Data

Risk: A malicious task title or description could be saved and later rendered as
HTML.

Mitigation: Task cards are created with DOM APIs and user-controlled fields are
assigned with `textContent`.

### Tampered localStorage Data

Risk: A user or extension could modify `localStorage` with unexpected values.

Mitigation: Saved tasks are parsed defensively, validated as an array, normalized,
and filtered before rendering.

### Overly Permissive Browser Capabilities

Risk: A static app could accidentally allow unnecessary network calls or object
loading.

Mitigation: The Content Security Policy restricts scripts, styles, images,
connections, objects, base URI, and form actions.

### Notification Permission Confusion

Risk: Users may think reminders are active when browser permissions are denied.

Mitigation: The UI displays notification status clearly and handles unsupported,
denied, default, and granted states.

## Security Assumptions

- The app is served from a trusted origin such as `localhost` during development
  or a controlled static hosting domain during deployment.
- The user's browser enforces CSP and Web Notification permissions correctly.
- There are no third-party scripts in the static version.

## Future Security Improvements

- Add automated tests for task rendering and localStorage normalization.
- Add deployment-level security headers if hosted behind a platform that supports
  custom headers.
- Add dependency scanning if the project later adopts npm packages.
- Add authentication and authorization checks if a backend is introduced.
