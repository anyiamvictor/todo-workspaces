import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Project.module.css";
// import AddEditTaskModal from "../../../components/AddEditTaskModal/AddEditTaskModal";
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
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../components/firebaseConfig";

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

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchTasks(), fetchProject(), fetchUsers()]);
    };
    loadAll();

    const interval = setInterval(fetchTasks, 1000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "tasks"), where("projectId", "==", projectId))
      );
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
      updateProjectStatus(projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const getUserNameById = (id) => {
    const found = users.find((u) => u.uid === id || u.id === id);
    return found ? found.name : "Unknown";
  };

  const incrementUserField = async (uid, field) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const current = userSnap.data()[field] || 0;
    await updateDoc(userRef, { [field]: current + 1 });
  };

  const decrementUserPending = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const current = userSnap.data().pendingCount || 0;
    await updateDoc(userRef, { pendingCount: current > 0 ? current - 1 : 0 });
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

    await incrementUserField(currentUser.uid, "completedCount");
    await decrementUserPending(task.assignedTo);
    fetchTasks();

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
      await incrementUserField(latestUser.userId, "approvedCount");
      await createNotifications({
        userId: latestUser.userId,
        message: `Your task completion on '${task.title}' was approved.`,
      });
    }

    fetchTasks();
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
      await incrementUserField(latestUser.userId, "rejectedCount");
      if (task.assignedTo) {
        await incrementUserField(task.assignedTo, "pendingCount");
      }
      await createNotifications({
        userId: latestUser.userId,
        message: `Your task completion on '${task.title}' was rejected.`,
      });
    }

    fetchTasks();
  };

  return (
    <div className={styles.projectContainer}>
      <h3>{projectName || "Loading..."}</h3>
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

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul className={styles.taskList}>
          {[...tasks]
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
      onSuccess={() => {
        setShowModal(false);
        fetchTasks();
      }}
    />
  ) : (
    <AddTaskHandler
      projectId={projectId}
      onClose={() => setShowModal(false)}
      onSuccess={() => {
        setShowModal(false);
        fetchTasks();
      }}
    />
  ))}

    </div>
  );
}

export default Project;
