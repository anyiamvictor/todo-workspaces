import React from "react";
import { useState } from "react";
import styles from "./TaskItem.module.css";
import { useAuth } from "../../contexts/AuthContext/AuthContext";



function TaskItem({ task, onDone, onApprove, onReject, onEdit,rejectDisabled }) {
  
  const [showDescription, setShowDescription] = useState(false);
  const { user } = useAuth();
  

  
  function getDueDateInfo(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    let label = "";
    let className = "";

    if (daysUntilDue < 0) {
      className = styles.overdue;
      label = `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? "s" : ""}`;
    } else if (daysUntilDue === 0) {
      className = styles.dueSoon;
      label = "Due today";
    } else if (daysUntilDue <= 3) {
      className = styles.dueSoon;
      label = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`;
    } else {
      className = "";
      label = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`;
    }

    return { className, label };
  }

  const { className: dueClass, label: dueLabel } = getDueDateInfo(task.dueDate);

  return (
    <li className={`${styles.taskItem} ${task.status === "approved" ? styles.finalized : ""}`}>
      <div className={styles.taskContent}>
        
        <div>
          <h3 className={styles.title}>{task.title}</h3>
          <div className={styles.taskid}>
            <div className={styles.meta}>
              <span>
                <strong>Status:</strong>{" "}
                <span className={`${styles.statusBadge} ${styles[`status-${task.status.toLowerCase()}`]}`}>
                  {task.status}
                </span>
              </span>
              <span>
                <strong>Assigned to:</strong>{" "}
                {task.assignedToName || "Unassigned"}
              </span>
              <span>
                <strong>Due:</strong>{" "}
                <span className={`${styles.dueDate} ${dueClass}`}>
                  {dueLabel} ({new Date(task.dueDate).toLocaleDateString()})
                </span>
              </span>
            </div>
            <div className={styles.taskActions}>
              <button onClick={() => onDone(task.id, user) }   disabled={task.doneClicked}>✅ Submit for Review</button>
              <button onClick={() => onApprove(task.id)} disabled = {task.status ==="approved"}> {task.status === "approved" ? "✅ Finalized" : "👍 Approve"}</button>
              <button onClick={() => onReject(task.id)} disabled={rejectDisabled || task.status === "approved"}>❌ Reject Submission</button>
              <button onClick={() => onEdit(task) }  disabled={task.status === "approved"}>✏️ Edit</button>

            </div>
          </div>
        </div>

        
        <div className={styles.noteSection}>
          <div className={styles.noteHeader}>
            <h4 className={styles.noteTitle}>📝 Note</h4>
            <button
              className={styles.toggleButton}
              onClick={() => setShowDescription(!showDescription)}
            >
              {showDescription ? "🔽" : "▶️"}
            </button>
          </div>

          <div
            className={`${styles.descriptionwrapper} ${showDescription ? styles.expanded : ""
              }`}
          >
            <p className={styles.description}>{task.description}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
export default TaskItem;

