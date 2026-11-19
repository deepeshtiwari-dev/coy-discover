# Coy Discover — SDE Intern Assignment

A standalone swipe-based discovery demo built for the Coy SDE Intern assignment.

## Features
- 32 seeded mock profiles with name, age, photo, bio, city and interests.
- Right swipe / Like and left swipe / Pass (drag gestures on touch and mouse; buttons also available).
- Profiles are removed from the feed after a swipe.
- Mutual matches only: a match is created when the current user likes a profile that has already liked them.
- Matches page lists mutual matches only.
- JSON file persistence across server restarts and page reloads.
- Home tab is intentionally a placeholder.
- Backend APIs: `GET /feed`, `POST /swipe`, `GET /matches`.

## Run locally
Requires Node.js LTS.

```bash
npm install
npm run install:all
npm run dev
```

Open the Vite URL shown in the terminal (normally http://localhost:5173).
Backend runs on http://localhost:3001. The frontend proxies `/api` requests to the backend.

## API
- `GET /health` — health check
- `GET /feed` — returns profiles not yet swiped on
- `POST /swipe` — JSON body: `{ "profileId": "p2", "action": "like" }` or action `pass`
- `GET /matches` — returns mutual matches only

## Demo matching
Some seeded profiles have already liked the demo user. Like one of those profiles to trigger the match screen. The API intentionally does not expose the `likedYou` field in feed responses.

## Reset demo data
Stop the backend, then replace `backend/data/db.json` with:

```json
{
  "profiles": [],
  "swipes": [],
  "matches": []
}
```

Restart the backend. The seed profiles will be regenerated automatically.

## Deployment note
For a single-service deployment, deploy the backend and frontend separately or configure a platform to serve the Vite build. Set `VITE_API_URL` in the frontend build environment to the deployed backend URL. The JSON file is suitable for this assignment demo; for production, use a database with proper concurrency and persistence guarantees.
