import React from "react";
import styles from "./TaskItem.module.css";

function TaskItem({ task, onDone, onApprove, onReject, onEdit }) {
  return (
    <li className={styles.taskItem}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>Status: <strong>{task.status}</strong></p>
      <p>Assigned to: {task.assignedTo}</p>
      <p>Due Date: {task.dueDate}</p>

      <div className={styles.taskActions}>
        <button onClick={() => onDone(task.id)}>Done</button>
        <button onClick={() => onApprove(task.id)}>Approve</button>
        <button onClick={() => onReject(task.id)}>Reject</button>
        <button onClick={() => onEdit(task)}>Edit</button>
      </div>
    </li>
  );
}

export default TaskItem;
