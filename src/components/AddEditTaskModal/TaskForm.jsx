// TaskForm.jsx
import Select from "react-select";
import styles from "./AddEditTaskModal.module.css";

export default function TaskForm({
  isEdit,
  formData,
  groupUsers,
  projectCreatedAt,
  projectEndDate,
  handleChange,
  handleSelectChange,
  handleSubmit,
  onClose,
}) {
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
      <img src={avatarUrl} alt={label} style={{ width: 24, height: 24, borderRadius: "50%" }} />
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
        <h2>{isEdit ? "Edit Task" : "Add New Task"}</h2>
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
            />
          </label>

          <label>
            Due Date:
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={projectCreatedAt}
              max={projectEndDate}
              required
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
            <button type="submit">{isEdit ? "Update" : "Create"}</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
