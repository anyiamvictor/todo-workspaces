import React, { useState } from "react";
import styles from "./AddProjectModal.module.css";

function AddProjectModal({ onClose, onSubmit }) {
    
    
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endDate: "",
    status: "pending",
    
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData });
  };
  
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2>Add New Project</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="name"
            placeholder="Project Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className={styles.textareaWrapper}>
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={200}
            />
            <small
              style={{
                color: 200 - formData.description.length < 50 ? 'red' : '#666'
              }}
            >
              {200 - formData.description.length} characters remaining
            </small>

          </div>

          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <div className={styles.actions}>
            <button type="submit">Save Project</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default AddProjectModal;
