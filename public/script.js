const API_BASE = "/api";

const sessionForm = document.getElementById("session-form");
const sessionsList = document.getElementById("sessions-list");
const suggestionsList = document.getElementById("suggestions-list");
const refreshBtn = document.getElementById("refresh-suggestions");

async function fetchSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    const data = await res.json();
    renderSessions(data);
  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}

async function fetchSuggestions() {
  try {
    suggestionsList.innerHTML = "<li>Loading suggestions...</li>";
    const res = await fetch(`${API_BASE}/suggestions`);
    const data = await res.json();
    renderSuggestions(data.suggestions || []);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    suggestionsList.innerHTML = "<li>Could not load suggestions. Try again.</li>";
  }
}

function renderSessions(sessions) {
  if (!sessions.length) {
    sessionsList.innerHTML =
      '<p class="empty">No sessions yet. Add your first study session above.</p>';
    return;
  }

  sessionsList.innerHTML = "";
  sessions
    .slice()
    .reverse()
    .forEach((s) => {
      const card = document.createElement("div");
      card.className = "session-card";

      const main = document.createElement("div");
      main.className = "session-main";

      const title = document.createElement("div");
      title.className = "session-title";
      title.textContent = `${s.subject} (${s.hours}h)`;

      const meta = document.createElement("div");
      meta.className = "session-meta";
      meta.textContent = new Date(s.date).toDateString();

      const tags = document.createElement("div");
      tags.className = "session-tags";

      const hoursTag = document.createElement("span");
      hoursTag.className = "tag hours";
      hoursTag.textContent = `${s.hours} h`;

      const moodTag = document.createElement("span");
      moodTag.className = "tag mood";
      moodTag.textContent = `Mood: ${s.mood}`;

      const prodTag = document.createElement("span");
      prodTag.className = "tag productivity";
      prodTag.textContent = `Productivity: ${s.productivity}`;

      tags.appendChild(hoursTag);
      tags.appendChild(moodTag);
      tags.appendChild(prodTag);

      main.appendChild(title);
      main.appendChild(meta);
      main.appendChild(tags);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteSession(s.id));

      card.appendChild(main);
      card.appendChild(deleteBtn);

      sessionsList.appendChild(card);
    });
}

function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = "";
  if (!suggestions.length) {
    suggestionsList.innerHTML =
      "<li>No specific suggestions yet. Keep logging your sessions.</li>";
    return;
  }

  suggestions.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    suggestionsList.appendChild(li);
  });
}

async function deleteSession(id) {
  if (!confirm("Delete this session?")) return;
  try {
    await fetch(`${API_BASE}/sessions/${id}`, {
      method: "DELETE"
    });
    await fetchSessions();
    await fetchSuggestions();
  } catch (err) {
    console.error("Error deleting session:", err);
  }
}

sessionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value.trim();
  const hours = document.getElementById("hours").value;
  const mood = document.getElementById("mood").value;
  const productivity = document.getElementById("productivity").value;

  if (!date || !subject || !hours) {
    alert("Please fill date, subject, and hours.");
    return;
  }

  try {
    await fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ date, subject, hours, mood, productivity })
    });

    sessionForm.reset();
    await fetchSessions();
    await fetchSuggestions();
  } catch (err) {
    console.error("Error adding session:", err);
  }
});

refreshBtn.addEventListener("click", () => {
  fetchSuggestions();
});

// Initial load
fetchSessions();
fetchSuggestions();
