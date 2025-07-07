import React, { useState } from "react";
import styles from "./AddProjectModal.module.css";
import TextSpinner from "../TextSpinner/TextSpinner"

function AddProjectModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endDate: "",
    status: "pending", // fixed status
  });
  const [submitting, setSubmitting] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true); // disable button immediately
    onSubmit({ ...formData, status: "pending" });
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
            autoFocus
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
                color: 200 - formData.description.length < 50 ? "red" : "#666",
              }}
            >
              {200 - formData.description.length} characters remaining
            </small>
          </div>
          <label>Due Date:</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]} // ✅ Prevent past dates
          />


          <div className={styles.actions}>
            <button type="submit" disabled={submitting}>{submitting ? <TextSpinner /> : "Save Project"}</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProjectModal;
