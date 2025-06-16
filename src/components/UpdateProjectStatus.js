export async function updateProjectStatus(projectId) {
  try {
    const res = await fetch(
      `http://localhost:3001/tasks?projectId=${projectId}`
    );
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const tasks = await res.json();

    let newStatus = "active"; // default

    if (tasks.length === 0) {
      newStatus = "pending"; // no tasks = pending
    } else {
      const allApproved = tasks.every((t) => t.status === "approved");
      const anyCompleted = tasks.some((t) => t.status === "completed");

      if (allApproved) newStatus = "completed";
      else newStatus = "active"; // fallback to active if tasks exist but not all approved
    }

    await fetch(`http://localhost:3001/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.error("Error updating project status:", err);
  }
}
