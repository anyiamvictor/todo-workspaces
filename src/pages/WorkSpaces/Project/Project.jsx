import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";;
import styles from "./Project.module.css";
import AddEditTaskModal from "../../../components/AddEditTaskModal/AddEditTaskModal";
import BackButton from "../../../components/BackButton/BackButton";
import TaskItem from "../../../components/TaskItem/TaskItem";

function Project() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectName, setProjectName] = useState("");



  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:3001/tasks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
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

  useEffect(() => {
    fetchTasks();
    fetchProject();
  }, [projectId]);

  const handleDone = async (taskId) => {
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    fetchTasks();
  };

  const handleApprove = async (taskId) => {
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    fetchTasks();
  };

  const handleReject = async (taskId) => {
    await fetch(`http://localhost:3001/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in-progress" }),
    });
    fetchTasks();
  };

  return (
    <div className={styles.projectContainer}>
      <h3>{projectName || "Loading..."}</h3>
      <p>Available Tasks:</p>

      {/* <p>This is the overview page for project <b>{projectId}</b>.</p> */}

      <div className={styles.btns}>

      <button className={styles.addTaskBtn} onClick={() => {
        setEditingTask(null);
        setShowModal(true);
      }}>
        + Add Task
        </button>
        
        <BackButton />
        </div>

      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
    <ul className={styles.taskList}>
    {tasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
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
