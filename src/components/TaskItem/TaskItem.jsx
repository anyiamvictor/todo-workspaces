import React, { useState, useEffect } from "react";
import styles from "./TaskItem.module.css";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../components/firebaseConfig";

function TaskItem({ task, onDone, onApprove, onReject, onEdit, rejectDisabled }) {
  const { user } = useAuth();
  const [projectOwnerId, setProjectOwnerId] = useState(null);

  useEffect(() => {
    const fetchProjectOwner = async () => {
      if (!task.projectId) return;
      try {
        const projectRef = doc(db, "projects", task.projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          setProjectOwnerId(projectData.createdBy);
        } else {
          console.warn("Project not found");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      }
    };

    fetchProjectOwner();
  }, [task.projectId]);

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
  const isSupervisor = user.role === "supervisor";
  const isProjectOwner = user.uid === projectOwnerId;

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
                <strong>Assigned to:</strong> {task.assignedToName || "Unassigned"}
              </span>
              {task.createdAt && (
                <span>
                  <strong>Created:</strong>{" "}
                  <span className={styles.createdDate}>
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </span>
              )}
              <span>
                <strong>Due:</strong>{" "}
                <span className={`${styles.dueDate} ${dueClass}`}>
                  {dueLabel} ({new Date(task.dueDate).toLocaleDateString()})
                </span>
              </span>
              <span>
                <strong>Priority:</strong>{" "}
                <span className={`${styles.priority} ${styles[`priority-${task.priority.toLowerCase()}`]}`}>
                  {task.priority}
                </span>
              </span>
            </div>

            <div className={styles.taskActions}>
              {!isProjectOwner && (
                <button onClick={() => onDone(task.id, user)} disabled={task.doneClicked}>
                  ✅ Submit for Review
                </button>
              )}

              {isSupervisor && isProjectOwner && (
                <>
                  <button
                    onClick={() => onApprove(task.id)}
                    disabled={task.status !== "completed"}
                    className={task.status !== "completed" ? styles.disabledButton : ""}
                  >
                    {task.status === "approved"
                      ? "✅ Finalized"
                      : task.status === "completed"
                        ? "👍 Approve"
                        : "👍 Approve"}
                  </button>

                  <button
                    onClick={() => onReject(task.id)}
                    disabled={rejectDisabled || task.status !== "completed"}
                    className={rejectDisabled || task.status !== "completed" ? styles.disabledButton : ""}
                  >
                    ❌ Reject Submission
                  </button>

                  <button
                    onClick={() => onEdit(task)}
                    disabled={task.status === "approved" || task.doneClicked}
                    className={task.status === "approved" || task.doneClicked ? styles.disabledButton : ""}
                  >
                    ✏️ Edit
                  </button>

                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.noteSection}>
          <div className={styles.noteHeader}>
            <h4 className={styles.noteTitle}>📝 Note</h4>
        
          </div>

          <div
          >
            <p className={styles.description}>{task.description}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

export default TaskItem;
