import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Project.module.css";
import AddEditTaskModal from "../../../components/AddEditTaskModal/AddEditTaskModal";
import BackButton from "../../../components/BackButton/BackButton";
import TaskItem from "../../../components/TaskItem/TaskItem";
import { updateProjectStatus } from "../../../components/UpdateProjectStatus";


//im suppose to refactor this componnet sothat all TAskItem related login goes to the TaskItem component
function Project() {
  console.log("Project component mounted");

  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [users, setUsers] = useState([]);

 useEffect(() => {
  fetchTasks();
  fetchProject();
  fetchUsers();

   const interval = setInterval(() => {
    console.log("helllllo")
    fetchTasks();
  }, 1000); // every seconds

  return () => clearInterval(interval); // cleanup when unmounting
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
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      setProjectName(data.name);
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/users");
      if (!res.ok) throw new Error("Failed to fetch users");
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

  const handleDone = async (taskId, user) => {
    const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
    const task = await res.json();
    if (task.doneClicked) return;
    const updatedLog = [
      ...(task.completedLog || []),
      {
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString()
      }
    ];
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        doneClicked: true,
        completedLog: updatedLog
      })
    });
  
    fetchTasks();
  };
  
  const handleApprove = async (taskId) => {
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
        status: "approved",
        completedBy: latestUser, 
      }),
    });
  
    fetchTasks();
  };

  const handleReject = async (taskId) => {
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pending",
        doneClicked: false // re-enable done button
      })
    });
  
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
              onDone={handleDone}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={(t) => {
                setEditingTask(t);
                setShowModal(true);
              }}
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
