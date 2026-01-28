const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory "database" for demo (you can later replace with MongoDB/Postgres)
let studySessions = [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart Study Habit Tracker API is running" });
});

// Get all sessions
app.get("/api/sessions", (req, res) => {
  res.json(studySessions);
});

// Add new session
app.post("/api/sessions", (req, res) => {
  const { date, subject, hours, mood, productivity } = req.body;

  if (!date || !subject || hours == null) {
    return res.status(400).json({ error: "date, subject, and hours are required" });
  }

  const newSession = {
    id: uuidv4(),
    date,
    subject,
    hours: Number(hours),
    mood: mood || "neutral",
    productivity: productivity || "medium"
  };

  studySessions.push(newSession);
  res.status(201).json(newSession);
});

// Delete a session
app.delete("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  const beforeLength = studySessions.length;
  studySessions = studySessions.filter((s) => s.id !== id);

  if (studySessions.length === beforeLength) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ message: "Session deleted", id });
});

// Simple "ML-style" suggestion endpoint
app.get("/api/suggestions", (req, res) => {
  const suggestions = generateSuggestions(studySessions);
  res.json({ suggestions });
});

// Simple rule-based analysis (can be extended later)
function generateSuggestions(sessions) {
  if (sessions.length === 0) {
    return [
      "Start by logging your study sessions for at least one week.",
      "Try to keep a consistent daily study routine (even 1–2 hours)."
    ];
  }

  let totalHours = 0;
  let lateNightCount = 0;
  let lowMoodCount = 0;
  let highHoursDays = 0;
  let subjectFrequency = {};

  sessions.forEach((s) => {
    totalHours += s.hours;

    // Very basic: treat hours > 4 as “heavy load”
    if (s.hours >= 4) {
      highHoursDays += 1;
    }

    // If date string contains "T" and time is >= 22:00 treat as late (if you later store time)
    // Here we simulate late-night by checking subject keyword "night" (you can improve later)
    if (s.subject.toLowerCase().includes("night")) {
      lateNightCount += 1;
    }

    if (s.mood === "sad" || s.mood === "tired") {
      lowMoodCount += 1;
    }

    if (!subjectFrequency[s.subject]) {
      subjectFrequency[s.subject] = 0;
    }
    subjectFrequency[s.subject] += 1;
  });

  const avgHours = totalHours / sessions.length;

  const suggestions = [];

  if (avgHours < 2) {
    suggestions.push(
      "Your average study time is low. Try to reach at least 2–3 hours per day by adding one extra focused session."
    );
  } else if (avgHours > 5) {
    suggestions.push(
      "You are studying many hours. Ensure you take regular breaks to avoid burnout."
    );
  } else {
    suggestions.push(
      "Your daily study time looks balanced. Keep the consistency and avoid big gaps between study days."
    );
  }

  if (lateNightCount > 0) {
    suggestions.push(
      "You have some late-night sessions. Shift heavy topics earlier in the day to improve focus and sleep."
    );
  }

  if (lowMoodCount > sessions.length * 0.3) {
    suggestions.push(
      "Many sessions have low mood. Try shorter, more frequent sessions and include breaks or lighter topics when you feel tired."
    );
  }

  const mostStudiedSubject = Object.keys(subjectFrequency).sort(
    (a, b) => subjectFrequency[b] - subjectFrequency[a]
  )[0];

  if (mostStudiedSubject) {
    suggestions.push(
      `You focus a lot on "${mostStudiedSubject}". Ensure you also revise other subjects regularly.`
    );
  }

  if (highHoursDays > sessions.length * 0.4) {
    suggestions.push(
      "You often have long sessions. Consider splitting them into 2–3 shorter blocks with small breaks."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Your pattern looks okay. Keep logging sessions and adjust based on how you feel and your results."
    );
  }

  return suggestions;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
