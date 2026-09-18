const STORAGE_KEY = "dataVedhiCandidates";

const demoCandidates = [
  {
    id: crypto.randomUUID(),
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "9876543210",
    role: "Frontend Developer",
    experience: "Fresher",
    status: "Applied",
    score: 0,
    notes: "Good communication skills",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Meera Reddy",
    email: "meera@example.com",
    phone: "9876501234",
    role: "Data Analyst",
    experience: "1 year",
    status: "Shortlisted",
    score: 82,
    notes: "Strong Excel and SQL knowledge",
    createdAt: new Date().toISOString()
  }
];

let candidates = [];
let currentView = "dashboard";
let editingId = null;

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    candidates = Array.isArray(saved) ? saved : demoCandidates;
  } catch {
    candidates = demoCandidates;
  }
  saveData();
}

function openModal(content) {
  $("#modalContent").innerHTML = content;
  const modal = $("#modal");
  if (typeof modal.showModal === "function") {
    if (!modal.open) modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function closeModal() {
  const modal = $("#modal");
  if (typeof modal.close === "function" && modal.open) modal.close();
  else modal.removeAttribute("open");
  editingId = null;
}

function navigate(view) {
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  const titles = {
    dashboard: ["Dashboard", "Overview of recruitment activity"],
    candidates: ["Candidates", "Manage all applications"],
    shortlisted: ["Shortlisted", "Candidates selected for the next stage"],
    selected: ["Selected", "Final selected candidates"],
    waiting: ["Waiting List", "Candidates kept for later review"],
    trash: ["Trash", "Rejected or removed applications"]
  };

  $("#pageTitle").textContent = titles[view]?.[0] || "Dashboard";
  $("#pageSubtitle").textContent = titles[view]?.[1] || "";
  render();
}

function getVisibleCandidates() {
  if (currentView === "shortlisted") {
    return candidates.filter(c => c.status === "Shortlisted");
  }
  if (currentView === "selected") {
    return candidates.filter(c => c.status === "Selected");
  }
  if (currentView === "waiting") {
    return candidates.filter(c => c.status === "Waiting");
  }
  if (currentView === "trash") {
    return candidates.filter(c => c.status === "Rejected" || c.status === "Trash");
  }
  return candidates.filter(c => c.status !== "Rejected" && c.status !== "Trash");
}

function render() {
  if (currentView === "dashboard") renderDashboard();
  else renderCandidatePage();
}

function renderDashboard() {
  const total = candidates.filter(c => c.status !== "Trash").length;
  const shortlisted = candidates.filter(c => c.status === "Shortlisted").length;
  const selected = candidates.filter(c => c.status === "Selected").length;
  const waiting = candidates.filter(c => c.status === "Waiting").length;

  $("#content").innerHTML = `
    <div class="stats">
      <div class="stat-card"><p>Total Applications</p><h3>${total}</h3></div>
      <div class="stat-card"><p>Shortlisted</p><h3>${shortlisted}</h3></div>
      <div class="stat-card"><p>Selected</p><h3>${selected}</h3></div>
      <div class="stat-card"><p>Waiting</p><h3>${waiting}</h3></div>
    </div>
    <div class="card">
      <h3>Recent Applications</h3>
      ${candidateTable(candidates.filter(c => c.status !== "Trash").slice(-5).reverse())}
    </div>
  `;
}

function renderCandidatePage() {
  $("#content").innerHTML = `
    <div class="toolbar">
      <input class="search" id="searchInput" placeholder="Search by name, email or role">
      <select id="statusFilter">
        <option value="">All statuses</option>
        <option>Applied</option>
        <option>Shortlisted</option>
        <option>Selected</option>
        <option>Waiting</option>
        <option>Rejected</option>
        <option>Trash</option>
      </select>
    </div>
    <div class="card table-wrap" id="candidateTableContainer">
      ${candidateTable(getVisibleCandidates())}
    </div>
  `;

  $("#searchInput").addEventListener("input", filterTable);
  $("#statusFilter").addEventListener("change", filterTable);
}

function filterTable() {
  const query = $("#searchInput").value.toLowerCase();
  const status = $("#statusFilter").value;

  const filtered = getVisibleCandidates().filter(c => {
    const matchesText = [c.name, c.email, c.role].some(value =>
      value.toLowerCase().includes(query)
    );
    const matchesStatus = !status || c.status === status;
    return matchesText && matchesStatus;
  });

  $("#candidateTableContainer").innerHTML = candidateTable(filtered);
}

function candidateTable(list) {
  if (!list.length) return `<div class="empty">No candidates found.</div>`;

  return `
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Role</th><th>Experience</th>
          <th>Status</th><th>Score</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(c => `
          <tr>
            <td>
              <strong>${escapeHTML(c.name)}</strong><br>
              <small>${escapeHTML(c.email)}</small>
            </td>
            <td>${escapeHTML(c.role)}</td>
            <td>${escapeHTML(c.experience)}</td>
            <td><span class="badge ${c.status.toLowerCase()}">${escapeHTML(c.status)}</span></td>
            <td>${c.score || "-"}</td>
            <td class="actions">
              <button class="secondary" data-action="view" data-id="${c.id}">View</button>
              <button class="primary" data-action="edit" data-id="${c.id}">Edit</button>
              <button class="primary" data-action="score" data-id="${c.id}">Score</button>
              ${c.status !== "Shortlisted" && c.status !== "Selected" && c.status !== "Rejected" && c.status !== "Trash"
                ? `<button class="warning" data-action="shortlist" data-id="${c.id}">Shortlist</button>` : ""}
              ${c.status === "Shortlisted" || c.status === "Waiting"
                ? `<button class="success" data-action="select" data-id="${c.id}">Select</button>` : ""}
              ${c.status !== "Waiting" && c.status !== "Selected" && c.status !== "Rejected" && c.status !== "Trash"
                ? `<button class="secondary" data-action="waiting" data-id="${c.id}">Wait</button>` : ""}
              ${c.status !== "Selected" && c.status !== "Rejected" && c.status !== "Trash"
                ? `<button class="danger" data-action="reject" data-id="${c.id}">Reject</button>` : ""}
              ${c.status === "Rejected"
                ? `<button class="danger" data-action="trash" data-id="${c.id}">Trash</button>` : ""}
              ${c.status === "Waiting" || c.status === "Rejected" || c.status === "Trash"
                ? `<button class="secondary" data-action="restore" data-id="${c.id}">Restore</button>` : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function openAddModal() {
  editingId = null;
  openModal(`
    <h3>Add Application</h3>
    <form id="candidateForm" class="form-grid">
      ${candidateFields()}
      <div class="form-actions">
        <button type="button" class="secondary" data-action="close-modal">Cancel</button>
        <button class="primary" type="submit">Save Application</button>
      </div>
    </form>
  `);
  $("#candidateForm").addEventListener("submit", saveCandidate);
}

function candidateFields(candidate = {}) {
  return `
    <label>Name
      <input name="name" required value="${escapeHTML(candidate.name || "")}">
    </label>
    <label>Email
      <input name="email" type="email" required value="${escapeHTML(candidate.email || "")}">
    </label>
    <label>Phone
      <input name="phone" required value="${escapeHTML(candidate.phone || "")}">
    </label>
    <label>Role
      <input name="role" required value="${escapeHTML(candidate.role || "")}">
    </label>
    <label>Experience
      <input name="experience" required value="${escapeHTML(candidate.experience || "")}">
    </label>
    <label>Notes
      <textarea name="notes" rows="3">${escapeHTML(candidate.notes || "")}</textarea>
    </label>
  `;
}

function saveCandidate(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());

  if (editingId) {
    const index = candidates.findIndex(c => c.id === editingId);
    if (index !== -1) candidates[index] = { ...candidates[index], ...data };
  } else {
    candidates.push({
      id: crypto.randomUUID(),
      ...data,
      status: "Applied",
      score: 0,
      createdAt: new Date().toISOString()
    });
  }

  saveData();
  closeModal();
  render();
}

function openEditModal(id) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;
  editingId = id;

  openModal(`
    <h3>Edit Application</h3>
    <form id="candidateForm" class="form-grid">
      ${candidateFields(candidate)}
      <div class="form-actions">
        <button type="button" class="secondary" data-action="close-modal">Cancel</button>
        <button class="primary" type="submit">Update Application</button>
      </div>
    </form>
  `);
  $("#candidateForm").addEventListener("submit", saveCandidate);
}

function openCandidate(id) {
  const c = candidates.find(candidate => candidate.id === id);
  if (!c) return;

  openModal(`
    <h3>Candidate Details</h3>
    <div class="detail-grid">
      <div><strong>Name:</strong> ${escapeHTML(c.name)}</div>
      <div><strong>Email:</strong> ${escapeHTML(c.email)}</div>
      <div><strong>Phone:</strong> ${escapeHTML(c.phone)}</div>
      <div><strong>Role:</strong> ${escapeHTML(c.role)}</div>
      <div><strong>Experience:</strong> ${escapeHTML(c.experience)}</div>
      <div><strong>Status:</strong> ${escapeHTML(c.status)}</div>
      <div><strong>Score:</strong> ${c.score || "-"}</div>
      <div><strong>Notes:</strong> ${escapeHTML(c.notes)}</div>
    </div>
    <div class="form-actions">
      <button class="secondary" data-action="close-modal">Close</button>
      <button class="primary" data-action="edit" data-id="${c.id}">Edit</button>
    </div>
  `);
}

function updateStatus(id, status) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;
  candidate.status = status;
  if (status === "Selected") candidate.score = candidate.score || 100;
  saveData();
  render();
}

function shortlistCandidate(id) {
  updateStatus(id, "Shortlisted");
}

function selectCandidate(id) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;

  openModal(`
    <h3>Final Selection</h3>
    <form id="scoreForm" class="form-grid">
      <p>Enter the candidate's evaluation score.</p>
      <label>Score (0-100)
        <input name="score" type="number" min="0" max="100" value="${candidate.score || 0}" required>
      </label>
      <div class="form-actions">
        <button type="button" class="secondary" data-action="close-modal">Cancel</button>
        <button class="success" type="submit">Confirm Selection</button>
      </div>
    </form>
  `);

  $("#scoreForm").addEventListener("submit", event => {
    event.preventDefault();
    const score = Number(new FormData(event.target).get("score"));
    candidate.score = Math.max(0, Math.min(100, score));
    candidate.status = "Selected";
    saveData();
    closeModal();
    render();
  });
}

function rejectCandidate(id) {
  if (!confirm("Reject this candidate?")) return;
  updateStatus(id, "Rejected");
}

function moveToWaiting(id) {
  updateStatus(id, "Waiting");
}

function moveToTrash(id) {
  updateStatus(id, "Trash");
}

function restoreCandidate(id) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;
  candidate.status = "Applied";
  saveData();
  render();
}

function openScoreModal(id) {
  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return;
  openModal(`
    <h3>Add Candidate Score</h3>
    <form id="scoreForm" class="form-grid">
      <label>Candidate<input value="${escapeHTML(candidate.name)}" disabled></label>
      <label>Score (0-100)<input name="score" type="number" min="0" max="100" value="${candidate.score || 0}" required></label>
      <div class="form-actions">
        <button type="button" class="secondary" data-action="close-modal">Cancel</button>
        <button type="submit" class="primary">Save Score</button>
      </div>
    </form>
  `);
  $("#scoreForm").addEventListener("submit", event => {
    event.preventDefault();
    const score = Number(new FormData(event.target).get("score"));
    candidate.score = Math.max(0, Math.min(100, score));
    saveData();
    closeModal();
    render();
  });
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action], [data-view]");
  if (!button) return;

  event.preventDefault();

  if (button.dataset.view) {
    navigate(button.dataset.view);
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;

  switch (action) {
    case "add": openAddModal(); break;
    case "close-modal": closeModal(); break;
    case "view": openCandidate(id); break;
    case "edit": openEditModal(id); break;
    case "shortlist": shortlistCandidate(id); break;
    case "select": selectCandidate(id); break;
    case "reject": rejectCandidate(id); break;
    case "waiting": moveToWaiting(id); break;
    case "trash": moveToTrash(id); break;
    case "restore": restoreCandidate(id); break;
    case "score": openScoreModal(id); break;
  }
});

$("#logoutBtn").addEventListener("click", () => {
  if (!confirm("Reset all dashboard data?")) return;
  localStorage.removeItem(STORAGE_KEY);
  loadData();
  navigate("dashboard");
});

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  navigate("dashboard");
});
