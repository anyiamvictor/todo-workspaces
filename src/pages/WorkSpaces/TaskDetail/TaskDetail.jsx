import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./TaskDetail.module.css";
import BackButton from "../../../components/BackButton/BackButton";

function TaskDetail() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`http://localhost:3001/tasks/${taskId}`);
        if (!res.ok) throw new Error("Task not found");
        const data = await res.json();
        setTask(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTask();
  }, [taskId]);

  if (loading) return <p>Loading task...</p>;
  if (error) return <p>{error}</p>;
  if (!task) return <p>No task found.</p>;

  return (
    <div className={styles.taskDetail}>
      <h2>{task.title}</h2>
      <p><strong>Description:</strong> {task.description}</p>
      <p><strong>Status:</strong> {task.status}</p>
      <p><strong>Priority:</strong> {task.priority}</p>
      <p><strong>Due Date:</strong> {task.dueDate}</p>
      <p><strong>Assigned To:</strong> {task.assignedTo}</p>
      <BackButton />
    </div>
  );
}

export default TaskDetail;
