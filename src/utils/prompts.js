export const DAILY_PROMPTS = [
  "What was the most unexpected thing that made you smile today? 🌸",
  "What is the best bite of food you tasted today? 🍰",
  "Which song did you have on repeat today? 🎵",
  "If today had a movie or episode title, what would it be? 🎬",
  "What's one thing you are craving right this second? 🍜",
  "What was the funniest micro-moment from your day? 😂",
  "Rate your energy level today from 1 to 10 and why? ⚡",
  "What's one small win or proud moment you had today? 🏆",
  "Where would you teleport with me right now if you could? ✈️",
  "What scent or flavor reminds you of today? ☕",
  "What is something silly or random you thought about today? 💭",
  "What book, reel, or show did you get hooked on today? 📱",
  "What is one cozy comfort you need before sleeping tonight? 🧸",
  "What is something you wish we could do together this weekend? 🌻"
];

export function getTodayPrompt(dateStr = new Date().toISOString().slice(0, 10)) {
  // Hash the date string to consistently pick the same question for both users on that day
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}
