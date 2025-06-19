import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./ProjectList.module.css";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";

function ProjectList() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [warnIncomplete, setWarnIncomplete] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);


  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchTasks();

    const interval = setInterval(() => {
      fetchProjects();
    }, 5000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/projects?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(`http://localhost:3001/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("User fetch error:", err);
    }
  }

  async function fetchTasks() {
    try {
      const response = await fetch("http://localhost:3001/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Task fetch error:", err);
    }
  }

  function getUserNameById(userId) {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown";
  }

  function getTaskStatsForProject(projectId) {
    const relatedTasks = tasks.filter((task) => task.projectId === projectId);
    const total = relatedTasks.length;
    const completed = relatedTasks.filter((task) => task.status === "approved").length;
    const uncompleted = total - completed;
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const uncompletedPercent = 100 - completedPercent;

    return {
      total,
      completed,
      uncompleted,
      completedPercent,
      uncompletedPercent
    };
  }

  function handleDeleteClick(project) {
    if (user?.id !== project.createdBy) {
      setPermissionDenied(true);
      return;
    }
    const stats = getTaskStatsForProject(project.id);
    const hasUnapprovedTasks = stats.uncompleted > 0;

    if (project.status === "completed") {
      setProjectToDelete(project);
      setWarnIncomplete(false);
      setShowModal(true);
    } else if (project.status === "active" && hasUnapprovedTasks) {
      setProjectToDelete(project);
      setWarnIncomplete(true);
      setShowModal(true);
    } else {
      setProjectToDelete(project);
      setWarnIncomplete(false);
      setShowModal(true);
    }
  }

  async function deleteProjectAndChildren(projectId) {
    try {
      // Delete related tasks
      const relatedTasksRes = await fetch(`http://localhost:3001/tasks?projectId=${projectId}`);
      const relatedTasks = await relatedTasksRes.json();
      await Promise.all(relatedTasks.map(task =>
        fetch(`http://localhost:3001/tasks/${task.id}`, { method: "DELETE" })
      ));

      // Increment user stat if eligible
      const project = projects.find(p => p.id === projectId);
      const taskStats = getTaskStatsForProject(projectId);

      if (
        project.status === "completed" &&
        taskStats.uncompleted === 0 &&
        user?.id === project.createdBy
      ) {
        const updatedTotal = (user.totalProjectsCompleted || 0) + 1;
        await fetch(`http://localhost:3001/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalProjectsCompleted: updatedTotal })
        });
      }

      // Delete the project
      await fetch(`http://localhost:3001/projects/${projectId}`, {
        method: "DELETE"
      });

      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete project");
    }
  }

  function handleConfirmDelete() {
    if (projectToDelete) {
      deleteProjectAndChildren(projectToDelete.id);
    }
    setShowModal(false);
    setProjectToDelete(null);
    setWarnIncomplete(false);
  }

  function handleCancelDelete() {
    setShowModal(false);
    setProjectToDelete(null);
    setWarnIncomplete(false);
  }

  function getProgressColor(percent) {
    if (percent < 30) return "#e53e3e";
    if (percent < 70) return "#dd6b20";
    return "#38a169";
  }

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p>Error: {error}</p>;
  if (projects.length === 0) return <p>No projects found for this workspace.</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Projects:</h3>

      <ul className={styles.projectList}>
        {projects.map((project) => (
          <li
            key={project.id}
            className={`${styles.projectItem} ${
              project.status === "completed"
                ? styles.completed
                : project.status === "pending"
                ? styles.pending
                : ""
            }`}
          >
            <Link
              to={`/workspaces/${workspaceId}/projects/${project.id}`}
              className={styles.projectLink}
            >
              <div className={styles.projectTopRow}>
                <span className={styles.projectName}>{project.name}</span>
                <button
                  className={styles.deleteButton}
                  title="Delete project"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteClick(project);
                  }}
                >
                  🗑️
                </button>
              </div>
              <div className={styles.projectMeta}>
                <span>👤 {getUserNameById(project.createdBy)}</span>
                <span>📅 {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A"}</span>
                {(() => {
                  const stats = getTaskStatsForProject(project.id);
                  return (
                    <div className={styles.taskProgress}>
                      <div
                        className={styles.progressBarContainer}
                        title={`✅ ${stats.completed} completed\n❌ ${stats.uncompleted} uncompleted\n📋 ${stats.total} total`}
                      >
                        <div
                          className={styles.progressBar}
                          style={{
                            width: `${stats.completedPercent}%`,
                            backgroundColor: getProgressColor(stats.completedPercent)
                          }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {stats.completedPercent}% done
                      </span>
                    </div>
                  );
                })()}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {warnIncomplete ? (
              <p>
                This project has incomplete or unapproved tasks. Deleting it now means
                <strong> Project stats will not increase.</strong><br />
                Are you sure you want to delete <strong>{projectToDelete?.name}</strong> and all its tasks?
              </p>
            ) : (
              <p>
                Are you sure you want to delete <strong>{projectToDelete?.name}</strong> and all its tasks?
              </p>
            )}
            <div className={styles.modalActions}>
              <button onClick={handleConfirmDelete} className={styles.confirmButton}>
                Yes, Delete
              </button>
              <button onClick={handleCancelDelete} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{permissionDenied && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <p>
        ❌ <strong>You don’t have permission</strong> to delete this project.<br />
        Please contact the project owner or an admin.
      </p>
      <div className={styles.modalActions}>
        <button
          onClick={() => setPermissionDenied(false)}
          className={styles.cancelButton}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default ProjectList;
