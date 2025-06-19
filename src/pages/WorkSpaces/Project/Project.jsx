import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Project.module.css";
import AddEditTaskModal from "../../../components/AddEditTaskModal/AddEditTaskModal";
import BackButton from "../../../components/BackButton/BackButton";
import TaskItem from "../../../components/TaskItem/TaskItem";
import { updateProjectStatus } from "../../../components/UpdateProjectStatus";
import { useAuth } from "../../../contexts/AuthContext/AuthContextFirebase";
import { createNotifications } from "../../../components/createNotifications";

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
        wasRejected: false,
        completedLog: updatedLog,
      }),
    });
  
    await incrementUserField(currentUser.id, "completedCount");
    await decrementUserPending(task.assignedTo);
    fetchTasks();
  
    // ✅ createNotifications added: Notify project owner
    const projectRes = await fetch(`http://localhost:3001/projects/${projectId}`);
    const project = await projectRes.json();
  
    await createNotifications({
      userId: project.createdBy,
      message: `A task was marked as done by ${currentUser.name} in '${project.name}'.`,
    });
  };
  
  const handleApprove = async (taskId) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
  
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
  
      // ✅ createNotifications added: Notify user of approval
      await createNotifications({
        userId: latestUser.userId,
        message: `Your task completion on '${task.title}' was approved.`,
      });
    }
  
    fetchTasks();
  };
  
  const handleReject = async (taskId) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
  
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
        wasRejected: true,
      }),
    });
  
    if (latestUser) {
      await incrementUserField(latestUser.userId, "rejectedCount");
  
      if (task.assignedTo) {
        await incrementUserField(task.assignedTo, "pendingCount");
      }
  
      // ✅ createNotifications added: Notify user of rejection
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
          {
         [...tasks]
         .sort((a, b) => {
           if (sortOption === "dueDate") {
             return new Date(a.dueDate) - new Date(b.dueDate);
           } else if (sortOption === "priority") {
             const priorityOrder = { High: 1, Medium: 2, Low: 3 };
             return priorityOrder[a.priority] - priorityOrder[b.priority];
           } else {
             const aScore =
               (a.assignedTo === user.id ? 0 : 2) +
               (a.status === "pending" ? 0 : 1); // 0 = best, 1 = less important, 2 = least important
             const bScore =
               (b.assignedTo === user.id ? 0 : 2) +
               (b.status === "pending" ? 0 : 1);
       
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
              ))
          }
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
