import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./ProjectList.module.css";

function ProjectList() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // ✅ Users state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [tasks, setTasks] = useState([]);


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
    setProjectToDelete(project);
    setShowModal(true);
  }


  
  async function deleteProjectAndChildren(projectId) {
    try {
      const tasksRes = await fetch(`http://localhost:3001/tasks?projectId=${projectId}`);
      const tasks = await tasksRes.json();
      await Promise.all(tasks.map(task => fetch(`http://localhost:3001/tasks/${task.id}`, { method: "DELETE" })));

      await fetch(`http://localhost:3001/projects/${projectId}`, { method: "DELETE" });

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
  }

  function handleCancelDelete() {
    setShowModal(false);
    setProjectToDelete(null);
  }
  function getProgressColor(percent) {
    if (percent < 30) return "#e53e3e";       // red
    if (percent < 70) return "#dd6b20";       // orange
    return "#38a169";                         // green
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
          className={`${styles.projectItem} ${project.status === "completed" ? styles.completed :project.status=== "pending"? styles.pending:""}`}
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
                    <div className={styles.progressBarContainer} title={`✅ ${stats.completed} completed\n❌ ${stats.uncompleted} uncompleted\n📋 ${stats.total} total`}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${stats.completedPercent}%`,  backgroundColor: getProgressColor(stats.completedPercent) }}
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
            <p>Are you sure you want to delete <strong>{projectToDelete?.name}</strong> and all its tasks?</p>
            <div className={styles.modalActions}>
              <button onClick={handleConfirmDelete} className={styles.confirmButton}>Yes, Delete</button>
              <button onClick={handleCancelDelete} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
