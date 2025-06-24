import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./ProjectList.module.css";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import {
  collection,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db } from "../../components/firebaseConfig";
import SkeletonBlock from "../SkeletonBlock/SkeletonBlock"
import TextSpinner from "../TextSpinner/TextSpinner";

function ProjectList() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [warnIncomplete, setWarnIncomplete] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribeProjects = onSnapshot(
      query(collection(db, "projects"), where("workspaceId", "==", workspaceId)),
      (snapshot) => {
        setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => setError(err.message)
    );

    const unsubscribeTasks = onSnapshot(
      query(collection(db, "tasks"), where("workspaceId", "==", workspaceId)),
      (snapshot) => {
        setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => setError(err.message)
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => setError(err.message)
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeUsers();
    };
  }, [workspaceId]);

  const getUserNameById = (uid) => {
    const userObj = users.find((u) => u.uid === uid);
    return userObj ? userObj.name : "Unknown";
  };

  const getTaskStatsForProject = (projectId) => {
    const relatedTasks = tasks.filter((task) => task.projectId === projectId);
    const total = relatedTasks.length;
    const completed = relatedTasks.filter((task) => task.status === "approved").length;
    const uncompleted = total - completed;
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      uncompleted,
      completedPercent,
      uncompletedPercent: 100 - completedPercent,
    };
  };

  const handleDeleteClick = (project) => {
    if (user?.uid !== project.createdBy) {
      setPermissionDenied(true);
      return;
    }
    const stats = getTaskStatsForProject(project.id);
    const hasUnapprovedTasks = stats.uncompleted > 0;

    setProjectToDelete(project);
    setWarnIncomplete(project.status === "active" && hasUnapprovedTasks);
    setShowModal(true);
  };
  const deleteProjectAndChildren = async (projectId) => {
    try {
      const taskQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
      const taskSnap = await getDocs(taskQuery);
      const tasksToDelete = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      // Count pending tasks per user
      const pendingCountMap = {};
      for (const task of tasksToDelete) {
        if (task.status === "pending" && task.assignedTo) {
          pendingCountMap[task.assignedTo] = (pendingCountMap[task.assignedTo] || 0) + 1;
        }
      }
  
      // Update each affected user's pendingCount
      const updateUserPromises = Object.entries(pendingCountMap).map(async ([userId, count]) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const current = userSnap.data().pendingCount || 0;
          await updateDoc(userRef, { pendingCount: Math.max(0, current - count) });
        }
      });
  
      // Delete all tasks
      const deleteTaskPromises = tasksToDelete.map((task) => deleteDoc(doc(db, "tasks", task.id)));
  
      await Promise.all([...updateUserPromises, ...deleteTaskPromises]);
  
      // Handle project stat for completed projects
      const project = projects.find((p) => p.id === projectId);
      const stats = getTaskStatsForProject(projectId);
  
      if (
        project.status === "completed" &&
        stats.uncompleted === 0 &&
        user?.uid === project.createdBy
      ) {
        const userDoc = users.find((u) => u.uid === user.uid);
        const userRef = doc(db, "users", userDoc.id);
        await updateDoc(userRef, {
          totalProjectsCompleted: (userDoc.totalProjectsCompleted || 0) + 1,
        });
      }
  
      await deleteDoc(doc(db, "projects", projectId));
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete project");
    }
  };
  

  const handleConfirmDelete = async () => {
    if (!projectToDelete || deleting) return;
    setDeleting(true);
    await deleteProjectAndChildren(projectToDelete.id);
    setDeleting(false);
    setShowModal(false);
    setProjectToDelete(null);
    setWarnIncomplete(false);
  };

  const handleCancelDelete = () => {
    setShowModal(false);
    setProjectToDelete(null);
    setWarnIncomplete(false);
  };

  const getProgressColor = (percent) => {
    if (percent < 30) return "#e53e3e";
    if (percent < 70) return "#dd6b20";
    return "#38a169";
  };

  if (loading) return  <div style={{
    display: "flex",
    flexDirection: "column",
    gap:"20px",
    justifyContent: "center",
    height: "100vh",
    width: "100%",   // full width
  }}>
   
    <SkeletonBlock width="80%" height="20px" />
    <SkeletonBlock width="90%" height="20px" />
    <SkeletonBlock width="70%" height="20px" />
    <SkeletonBlock width="60%" height="50px" />
    <SkeletonBlock width="40%" height="20px" />
    <SkeletonBlock width="60%" height="30px" />
    <SkeletonBlock width="80%" height="20px" />
    <SkeletonBlock width="90%" height="20px" />
    <SkeletonBlock width="70%" height="20px" />
    <SkeletonBlock width="60%" height="50px" />
    <SkeletonBlock width="40%" height="20px" />
    <SkeletonBlock width="60%" height="30px" />

  </div>;
  if (error) return <p>Error: {error}</p>;
  if (projects.length === 0) return <p>No projects found for this workspace.</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Projects:</h3>

      <ul className={styles.projectList}>
        {projects.map((project) => {
          const stats = getTaskStatsForProject(project.id);
          return (
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
                  {user.role === "supervisor" && (
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
                  )}
                </div>
                <div className={styles.projectMeta}>
                  <span>👤 {getUserNameById(project.createdBy)}</span>
                  <span>
                    📅{" "}
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <div className={styles.taskProgress}>
                    <div
                      className={styles.progressBarContainer}
                      title={`✅ ${stats.completed} completed\n❌ ${stats.uncompleted} uncompleted\n📋 ${stats.total} total`}
                    >
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${stats.completedPercent}%`,
                          backgroundColor: getProgressColor(stats.completedPercent),
                        }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {stats.completedPercent}% done
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Confirmation Modal */}
{/* Confirmation Modal */}
{showModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <p>
        {warnIncomplete
          ? `This project has unapproved tasks. Deleting now won't increase your stats.`
          : `Are you sure you want to delete "${projectToDelete?.name}" and all its tasks?`}
      </p>
      <div className={styles.modalActions}>
        <button
          onClick={handleConfirmDelete}
          className={styles.confirmButton}
          disabled={deleting}
        >
          {deleting ? <TextSpinner/>: "Yes, Delete"}
        </button>
        <button
          onClick={handleCancelDelete}
          className={styles.cancelButton}
          disabled={deleting}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      {/* Permission Denied Modal */}
      {permissionDenied && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>
              ❌ You don’t have permission to delete this project.
              <br />
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
