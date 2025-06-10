import { useState, useEffect } from "react";
import styles from "./AddEditTaskModal.module.css";


function AddEditTaskModal({ projectId, task, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    status: "in-progress",
    priority: "medium"
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = task
      ? `http://localhost:3001/tasks/${task.id}`
      : "http://localhost:3001/tasks";

    const method = task ? "PUT" : "POST";

    const payload = {
      ...formData,
      projectId
    };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    onSuccess();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{task ? "Edit Task" : "Add New Task"}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Title:
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </label>

          <label>
            Description:
            <textarea name="description" value={formData.description} onChange={handleChange} required />
          </label>

          <label>
            Assigned To:
            <input type="text" name="assignedTo" value={formData.assignedTo} onChange={handleChange} />
          </label>

          <label>
            Due Date:
            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} />
          </label>

          <label>
            Priority:
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className={styles.actions}>
            <button type="submit">{task ? "Update" : "Create"}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditTaskModal;
