import { useState, useEffect } from "react";
import Select from "react-select";
import styles from "./AddEditTaskModal.module.css";
import { useAuth } from "../../contexts/AuthContext/AuthContext";

function AddEditTaskModal({ projectId, task, onClose, onSuccess }) {
  const { user } = useAuth();
  const [groupUsers, setGroupUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: null,
    dueDate: "",
    status: "pending",
    priority: "medium",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        assignedTo: task.assignedTo
          ? {
              value: task.assignedTo,
              label: "",
              avatarUrl: "",
              isOnline: false,
              isDisabled: false,
            }
          : null,
      });
    }
  }, [task]);

  useEffect(() => {
    async function fetchGroupUsers() {
      try {
        const res = await fetch(`http://localhost:3001/users?groupId=${user.groupId}`);
        const data = await res.json();

        const filtered = data
          .filter((u) => u.role === "member" || u.role === "supervisor")
          .map((u) => ({
            value: u.id,
            label: u.name,
            avatarUrl: u.avatarUrl,
            isOnline: u.isOnline,
            isDisabled: !u.isOnline,
          }))
          .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

        setGroupUsers(filtered);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    }

    if (user?.groupId) {
      fetchGroupUsers();
    }
  }, [user?.groupId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedOption }));
  };

  const incrementPending = async (userId) => {
    const res = await fetch(`http://localhost:3001/users/${userId}`);
    const data = await res.json();
    const newCount = (data.pendingCount || 0) + 1;

    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingCount: newCount }),
    });
  };

  const decrementPending = async (userId) => {
    const res = await fetch(`http://localhost:3001/users/${userId}`);
    const data = await res.json();
    const newCount = Math.max((data.pendingCount || 0) - 1, 0);

    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingCount: newCount }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assignedId = formData.assignedTo?.value || "";
    const prevAssignedId = task?.assignedTo;

    const url = task
      ? `http://localhost:3001/tasks/${task.id}`
      : "http://localhost:3001/tasks";

    const method = task ? "PUT" : "POST";

    const payload = {
      ...formData,
      projectId,
      assignedTo: assignedId,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Error saving task");
      return;
    }

    // Handle pendingCount
    if (!task && assignedId) {
      await incrementPending(assignedId);
    } else if (task && assignedId !== prevAssignedId) {
      if (prevAssignedId) await decrementPending(prevAssignedId);
      if (assignedId) await incrementPending(assignedId);
    }

    onSuccess();
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      opacity: state.data.isDisabled ? 0.5 : 1,
      backgroundColor: state.isFocused ? "#eee" : "white",
      color: "black",
      cursor: state.data.isDisabled ? "not-allowed" : "default",
    }),
    singleValue: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }),
  };

  const formatOptionLabel = ({ label, avatarUrl, isOnline }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
      <img
        src={avatarUrl}
        alt={label}
        style={{ width: 24, height: 24, borderRadius: "50%" }}
      />
      <span>{label}</span>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: isOnline ? "limegreen" : "gray",
          marginLeft: "auto",
        }}
        title={isOnline ? "Online" : "Offline"}
      ></span>
    </div>
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{task ? "Edit Task" : "Add New Task"}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Description:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={400}
            />
            <small>{400 - formData.description.length} characters remaining</small>
          </label>

          <label>
            Assigned To:
            <Select
              options={groupUsers}
              value={formData.assignedTo}
              onChange={handleSelectChange}
              placeholder="Assign to user"
              styles={customStyles}
              formatOptionLabel={formatOptionLabel}
              isClearable
              isOptionDisabled={(option) => option.isDisabled}
            />
          </label>

          <label>
            Due Date:
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
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
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditTaskModal;
