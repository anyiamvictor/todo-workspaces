import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Project.module.css";
import AddEditTaskModal from "../../../components/AddEditTaskModal/AddEditTaskModal";
import BackButton from "../../../components/BackButton/BackButton";
import TaskItem from "../../../components/TaskItem/TaskItem";
import { updateProjectStatus } from "../../../components/UpdateProjectStatus";
import { useAuth } from "../../../contexts/AuthContext/AuthContext";


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
      const res = await fetch(`http://localhost:3001/tasks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
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
      const res = await fetch(`http://localhost:3001/projects/${projectId}`);
      const data = await res.json();
      setProjectName(data.name);
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const getUserNameById = (id) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name : "Unknown";
  };

  const incrementUserField = async (userId, field) => {
    const res = await fetch(`http://localhost:3001/users/${userId}`);
    const userData = await res.json();
    const newCount = (userData[field] || 0) + 1;

    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: newCount }),
    });
  };

  const decrementUserPending = async (userId) => {
    const res = await fetch(`http://localhost:3001/users/${userId}`);
    const userData = await res.json();
    const current = userData.pendingCount || 0;
    const newCount = current > 0 ? current - 1 : 0;

    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingCount: newCount }),
    });
  };

  const handleDone = async (taskId, currentUser) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
    if (task.doneClicked) return;

    const updatedLog = [
      ...(task.completedLog || []),
      {
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      },
    ];

    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        doneClicked: true,
        wasRejected:false,
        completedLog: updatedLog,

      }),
    });

    // ✅ Always increment completed count of the person who clicked done
    await incrementUserField(currentUser.id, "completedCount");

    // ✅ Always decrement pending for the assigned user
    await decrementUserPending(task.assignedTo);

    fetchTasks();
  };

  const handleApprove = async (taskId) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
  
    // Guard: Skip if already approved
    if (task.status === "approved") return;
  
    const latestUser =
      task.completedLog && task.completedLog.length > 0
        ? task.completedLog[task.completedLog.length - 1]
        : null;
  
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "approved",
        completedBy: latestUser,
      }),
    });
  
    if (latestUser) {
      await incrementUserField(latestUser.userId, "approvedCount");
    }
  
    fetchTasks();
  };


  const handleReject = async (taskId) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
    console.log(task)
  
    const latestUser =
      task.completedLog && task.completedLog.length > 0
        ? task.completedLog[task.completedLog.length - 1]
        : null;
  
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pending",
        doneClicked: false,
        wasRejected: true
      }),
    });
  
    if (latestUser) {
      await incrementUserField(latestUser.userId, "rejectedCount");
  
      // ✅ Restore pending for the assigned user
      if (task.assignedTo) {
        await incrementUserField(task.assignedTo, "pendingCount");
      }
    }
  
    fetchTasks();
  };
  
  

  return (
    <div className={styles.projectContainer}>
          <h3>{projectName || "Loading..."}</h3>
      <p>Available Tasks:</p>
  
      <div className={styles.btns}>
        <button
          className={styles.addTaskBtn}
          onClick={() => {
            setEditingTask(null);
            setShowModal(true);
          }}
        >
          + Add Task
        </button>
        <BackButton />
      </div>
  
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul className={styles.taskList}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={{ ...task, assignedToName: getUserNameById(task.assignedTo) }}
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
  
      {showModal && (
        <AddEditTaskModal
          projectId={projectId}
          task={editingTask}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
  
}

export default Project;
