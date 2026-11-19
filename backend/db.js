import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data", "db.json");

const firstNames = ["Aarav","Ananya","Ishaan","Meera","Kabir","Riya","Vihaan","Aisha","Arjun","Sara","Reyansh","Diya","Advait","Kiara","Krish","Myra","Dev","Tara","Rohan","Ira","Neil","Zoya","Aditya","Naina","Samar","Avni","Yash","Mahi","Ayaan","Siya","Dhruv","Jiya"];
const cities = ["Delhi","Gurgaon","Mumbai","Bengaluru","Pune","Jaipur","Hyderabad","Chandigarh"];
const interests = ["Music","Travel","Coffee","Movies","Photography","Books","Fitness","Food","Art","Cricket","Gaming","Hiking"];

function seedProfiles() {
  return firstNames.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    age: 21 + (i % 7),
    photo: `https://i.pravatar.cc/600?img=${(i % 70) + 1}`,
    bio: [
      "Always looking for a new cafe and a good conversation.",
      "Weekend explorer, weekday dreamer.",
      "Here for good music, better food and genuine people.",
      "A little introverted, very curious about the world."
    ][i % 4],
    city: cities[i % cities.length],
    interests: [interests[i % interests.length], interests[(i + 3) % interests.length], interests[(i + 6) % interests.length]],
    // Simulates profiles that have already liked the logged-in user.
    likedYou: [2, 5, 9, 14, 20, 27].includes(i + 1)
  }));
}

export function readDb() {
  if (!fs.existsSync(dbPath)) {
    const initial = { profiles: seedProfiles(), swipes: [], matches: [] };
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  if (!Array.isArray(db.profiles) || db.profiles.length === 0) {
    db.profiles = seedProfiles();
    db.swipes = db.swipes || [];
    db.matches = db.matches || [];
    writeDb(db);
  }
  return db;
}

export function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}
