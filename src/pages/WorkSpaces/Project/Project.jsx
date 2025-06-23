import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Project.module.css";
import AddTaskHandler from "../../../components/AddEditTaskModal/AddTaskHandler";
import EditTaskHandler from "../../../components/AddEditTaskModal/EditTaskHandler";
import BackButton from "../../../components/BackButton/BackButton";
import TaskItem from "../../../components/TaskItem/TaskItem";
import { updateProjectStatus } from "../../../components/UpdateProjectStatus";
import { useAuth } from "../../../contexts/AuthContext/AuthContextFirebase";
import { createNotifications } from "../../../components/createNotifications";
import {
  collection,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../components/firebaseConfig";
import { updateUserStat } from "../../../components/StatHandler";
import SkeletonBlock from "../../../components/SkeletonBlock/SkeletonBlock";

function Project() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [users, setUsers] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const [projectCreatedBy, setProjectCreatedBy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const unsubscribeTasks = onSnapshot(
      query(collection(db, "tasks"), where("projectId", "==", projectId)),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTasks(data);
        updateProjectStatus(projectId);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    fetchProject();
    fetchUsers();

    return () => unsubscribeTasks();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const projectRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(projectRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProjectName(data.name);
        setProjectCreatedBy(data.createdBy);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const snapshot = await onSnapshot(collection(db, "users"), (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      });
      return snapshot;
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const getUserNameById = (id) => {
    const found = users.find((u) => u.uid === id || u.id === id);
    return found ? found.name : "Unknown";
  };

  const handleDone = async (taskId, currentUser) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;
    const task = taskSnap.data();
    if (task.doneClicked) return;

    const updatedLog = [
      ...(task.completedLog || []),
      {
        userId: currentUser.uid,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      },
    ];

    await updateDoc(taskRef, {
      status: "completed",
      doneClicked: true,
      wasRejected: false,
      completedLog: updatedLog,
    });

    await updateUserStat(currentUser.uid, "completedCount", 1);
    if (task.assignedTo) {
      await updateUserStat(task.assignedTo, "pendingCount", -1);
    }

    const projectSnap = await getDoc(doc(db, "projects", projectId));
    const project = projectSnap.data();

    await createNotifications({
      userId: project.createdBy,
      message: `A task was marked as done by ${currentUser.name} in '${project.name}'.`,
    });
  };

  const handleApprove = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;
    const task = taskSnap.data();
    if (task.status === "approved") return;

    const latestUser = task.completedLog?.at(-1) || null;

    await updateDoc(taskRef, {
      status: "approved",
      completedBy: latestUser,
    });

    if (latestUser) {
      await updateUserStat(latestUser.userId, "approvedCount", 1);

      await createNotifications({
        userId: latestUser.userId,
        message: `Your task completion on '${task.title}' was approved.`,
      });
    }
  };

  const handleReject = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;
    const task = taskSnap.data();

    const latestUser = task.completedLog?.at(-1) || null;

    await updateDoc(taskRef, {
      status: "pending",
      doneClicked: false,
      wasRejected: true,
    });

    if (latestUser) {
      await updateUserStat(latestUser.userId, "rejectedCount", 1);
      if (task.assignedTo) {
        await updateUserStat(task.assignedTo, "pendingCount", 1);
      }

      await createNotifications({
        userId: latestUser.userId,
        message: `Your task completion on '${task.title}' was rejected.`,
      });
    }
  };

  return (
    <div className={styles.projectContainer}>
      <h3>{projectName || <SkeletonBlock/>}</h3>
      <p>Available Tasks:</p>

      <div className={styles.btns}>
        {user.uid === projectCreatedBy && (
          <button
            className={styles.addTaskBtn}
            onClick={() => {
              setEditingTask(null);
              setShowModal(true);
            }}
          >
            + Add Task
          </button>
        )}
        <BackButton />
      </div>

      <div className={styles.sortControls}>
        <div>
          <label htmlFor="sort">Sort tasks by: </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="default">Assigned to me (default)</option>
            <option value="dueDate">Due Date (Soonest First)</option>
            <option value="priority">Priority (High to Low)</option>
          </select>
        </div>

        <div className={styles.searchControls}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
             <div style={{
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
        
            </div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul className={styles.taskList}>
          {[...tasks]
            .filter((task) => {
              const q = searchQuery.toLowerCase();
              return (
                task.title.toLowerCase().includes(q) ||
                task.description.toLowerCase().includes(q)
              );
            })
            .sort((a, b) => {
              if (sortOption === "dueDate") {
                return new Date(a.dueDate) - new Date(b.dueDate);
              } else if (sortOption === "priority") {
                const priorityOrder = { High: 1, Medium: 2, Low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              } else {
                const aScore = (a.assignedTo === user.uid ? 0 : 2) + (a.status === "pending" ? 0 : 1);
                const bScore = (b.assignedTo === user.uid ? 0 : 2) + (b.status === "pending" ? 0 : 1);
                return aScore - bScore;
              }
            })
            .map((task) => (
              <TaskItem
                key={task.id}
                task={{
                  ...task,
                  assignedToName: getUserNameById(task.assignedTo),
                }}
                onDone={() => handleDone(task.id, user)}
                onApprove={() => handleApprove(task.id)}
                onReject={() => handleReject(task.id)}
                onEdit={(t) => {
                  setEditingTask(t);
                  setShowModal(true);
                }}
                rejectDisabled={task.wasRejected}
              />
            ))}
        </ul>
      )}

      {showModal &&
        (editingTask ? (
          <EditTaskHandler
            projectId={projectId}
            task={editingTask}
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        ) : (
          <AddTaskHandler
            projectId={projectId}
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        ))}
    </div>
  );
}

export default Project;
