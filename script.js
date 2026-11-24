const KEY = "gradetrack_data_v1";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

let db = { students: [], grades: [], attendance: [] };

try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (
    saved &&
    Array.isArray(saved.students) &&
    Array.isArray(saved.grades) &&
    Array.isArray(saved.attendance)
  ) {
    db = saved;
  }
} catch {
  console.warn("Saved data could not be read.");
}

const $ = (id) => document.getElementById(id);

$("attendanceDate").value = today();

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
  render();
}

function average(studentId) {
  const scores = db.grades.filter((g) => g.studentId === studentId);
  if (!scores.length) return null;
  return scores.reduce((sum, g) => sum + g.score, 0) / scores.length;
}

function studentName(id) {
  return db.students.find((s) => s.id === id)?.name || "Unknown student";
}

// Build HTML from text safely.
function cellText(value) {
  const td = document.createElement("span");
  td.textContent = value;
  return td.innerHTML;
}

function render() {
  const query = $("search").value.trim().toLowerCase();

  $("totalStudents").textContent = db.students.length;

  const averages = db.students
    .map((s) => average(s.id))
    .filter((v) => v !== null);

  const classAvg = averages.length
    ? averages.reduce((a, b) => a + b, 0) / averages.length
    : null;

  $("classAverage").textContent =
    classAvg === null ? "—" : classAvg.toFixed(1) + "%";

  $("passingStudents").textContent = db.students.filter((s) => {
    const avg = average(s.id);
    return avg !== null && avg >= 75;
  }).length;

  // Attendance rate: Present counts toward attendance.
  const records = db.attendance;
  const rate = records.length
    ? (records.filter((a) => a.status === "Present").length / records.length) *
      100
    : null;

  $("attendanceRate").textContent = rate === null ? "—" : rate.toFixed(1) + "%";

  const visible = db.students.filter((s) =>
    (s.name + " " + s.id).toLowerCase().includes(query),
  );

  $("studentRows").innerHTML =
    visible
      .map((s) => {
        const avg = average(s.id);
        const status =
          avg === null ? "No grades" : avg >= 75 ? "Passing" : "Failing";
        const badge = avg === null ? "" : avg >= 75 ? "pass" : "fail";

        return `<tr>
      <td><strong>${cellText(s.name)}</strong></td>
      <td>${cellText(s.id)}</td>
      <td>${avg === null ? "—" : avg.toFixed(1) + "%"}</td>
      <td><span class="badge ${badge}">${status}</span></td>
      <td><button class="danger" onclick="deleteStudent('${s.id}')">Delete</button></td>
    </tr>`;
      })
      .join("") || `<tr><td colspan="5">No students found.</td></tr>`;

  $("gradeStudent").innerHTML = db.students
    .map(
      (s) => `<option value="${cellText(s.id)}">${cellText(s.name)}</option>`,
    )
    .join("");

  $("attendanceStudent").innerHTML = $("gradeStudent").innerHTML;

  $("gradeRows").innerHTML =
    [...db.grades]
      .reverse()
      .map(
        (g, i) =>
          `<tr>
      <td>${cellText(studentName(g.studentId))}</td>
      <td>${cellText(g.subject)}</td>
      <td>${cellText(g.assessment)}</td>
      <td>${g.score}</td>
      <td><button class="danger" onclick="deleteGrade(${db.grades.length - 1 - i})">Delete</button></td>
    </tr>`,
      )
      .join("") || `<tr><td colspan="5">No grades recorded.</td></tr>`;

  const selectedDate = $("attendanceDate").value;
  $("attendanceRows").innerHTML =
    [...db.attendance]
      .map((a, i) => ({ ...a, index: i }))
      .filter((a) => a.date === selectedDate)
      .reverse()
      .map(
        (a) => `<tr>
      <td>${cellText(a.date)}</td>
      <td>${cellText(studentName(a.studentId))}</td>
      <td><span class="badge ${a.status.toLowerCase()}">${a.status}</span></td>
      <td><button class="danger" onclick="deleteAttendance(${a.index})">Delete</button></td>
    </tr>`,
      )
      .join("") ||
    `<tr><td colspan="4">No attendance recorded for this date.</td></tr>`;
}

function openStudentForm() {
  $("studentForm").reset();
  $("studentDialog").showModal();
  $("studentName").focus();
}

function closeStudentForm() {
  $("studentDialog").close();
}

$("studentForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("studentName").value.trim();
  const id = $("studentId").value.trim();

  if (!name || !id) return;
  if (db.students.some((s) => s.id.toLowerCase() === id.toLowerCase())) {
    alert("That student ID already exists.");
    return;
  }

  db.students.push({ id, name });
  $("studentDialog").close();
  save();
});

function deleteStudent(id) {
  if (!confirm("Delete this student and all associated grades and attendance?"))
    return;

  db.students = db.students.filter((s) => s.id !== id);
  db.grades = db.grades.filter((g) => g.studentId !== id);
  db.attendance = db.attendance.filter((a) => a.studentId !== id);
  save();
}

$("gradeForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!db.students.length) {
    alert("Add a student first.");
    return;
  }

  const score = Number($("score").value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    alert("Enter a grade from 0 to 100.");
    return;
  }

  db.grades.push({
    studentId: $("gradeStudent").value,
    subject: $("subject").value.trim(),
    assessment: $("assessment").value,
    score,
  });

  $("gradeForm").reset();
  save();
});

function deleteGrade(index) {
  if (!confirm("Delete this grade?")) return;
  db.grades.splice(index, 1);
  save();
}

$("attendanceForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!db.students.length) {
    alert("Add a student first.");
    return;
  }

  const studentId = $("attendanceStudent").value;
  const date = $("attendanceDate").value;
  const status = $("attendanceStatus").value;

  if (!date) {
    alert("Select an attendance date.");
    return;
  }

  // One attendance record per student per date.
  const existing = db.attendance.find(
    (a) => a.studentId === studentId && a.date === date,
  );

  if (existing) {
    existing.status = status;
  } else {
    db.attendance.push({ studentId, date, status });
  }

  save();
});

function deleteAttendance(index) {
  if (!confirm("Delete this attendance record?")) return;
  db.attendance.splice(index, 1);
  save();
}

$("attendanceDate").addEventListener("change", render);

render();
