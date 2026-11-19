import express from "express";
import cors from "cors";
import { readDb, writeDb } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function publicProfile(profile) {
  const { likedYou, ...safeProfile } = profile;
  return safeProfile;
}

// Profiles already swiped on are never returned again.
app.get("/feed", (req, res) => {
  const db = readDb();
  const swipedIds = new Set(db.swipes.map((swipe) => swipe.profileId));
  const feed = db.profiles
    .filter((profile) => !swipedIds.has(profile.id))
    .map(publicProfile);
  res.json({ profiles: feed });
});

app.post("/swipe", (req, res) => {
  const { profileId, action } = req.body || {};
  if (!profileId || !["like", "pass"].includes(action)) {
    return res.status(400).json({ error: "profileId and action (like/pass) are required." });
  }

  const db = readDb();
  const profile = db.profiles.find((item) => item.id === profileId);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  const existingSwipe = db.swipes.find((item) => item.profileId === profileId);
  if (existingSwipe) {
    return res.status(409).json({ error: "You have already swiped on this profile." });
  }

  db.swipes.push({ profileId, action, createdAt: new Date().toISOString() });

  // A match is created only when this user likes someone who has already liked them.
  let match = null;
  if (action === "like" && profile.likedYou) {
    match = {
      id: `m_${profile.id}`,
      profileId: profile.id,
      createdAt: new Date().toISOString()
    };
    db.matches.push(match);
  }

  writeDb(db);
  return res.json({
    success: true,
    action,
    matched: Boolean(match),
    match: match ? publicProfile(profile) : null
  });
});

app.get("/matches", (req, res) => {
  const db = readDb();
  const matches = db.matches
    .map((match) => db.profiles.find((profile) => profile.id === match.profileId))
    .filter(Boolean)
    .map(publicProfile);
  res.json({ matches });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Coy Discover API running on http://localhost:${PORT}`);
});
