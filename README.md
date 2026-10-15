# SkillSwap

SkillSwap is a student skill-exchange prototype built with React and Vite. It includes a student dashboard, skills and student discovery, editable profiles, progress tracking, and sent/received skill-exchange requests.

## Run locally

```sh
npm install
npm run dev
```

Use the URL printed by Vite. `npm run build` creates a production build, and `npm run lint` checks the source.

## Demo account and data

Create a student account from the welcome screen. Accounts, profile details, teaching and learning skills, progress, and exchange requests are saved in this browser's `localStorage` under `skillswap-demo-data-v1`. Passwords are stored as salted PBKDF2 hashes; the app does not display or save the submitted password in plain text.

This is **demo-only authentication**, not production authentication. `localStorage` is accessible to the browser profile and does not provide server-side identity verification, account recovery, or secure multi-user access. Data is not synchronized between browsers or devices. The sample profiles in student discovery are clearly marked demo students; registered accounts are local to this browser.

For a real multi-user service, replace this local data layer with a backend such as Supabase or Firebase, including server-managed authentication, authorization, and persistent request storage. Do not use real student credentials or sensitive data with this prototype.
