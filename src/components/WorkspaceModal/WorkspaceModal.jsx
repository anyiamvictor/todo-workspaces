import React, { useEffect, useState } from "react";
import styles from "./WorkspaceModal.module.css";

function WorkspaceModal({ user, onClose, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const res = await fetch("http://localhost:3001/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        setErrorUsers(error.message);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const groupMembers = users.filter(
      (u) => u.groupId === user.groupId && u.status === "active"
    );
    const newWorkspace = {
      id: `ws${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      ownerId: user.id,
      memberIds: groupMembers.map((u) => u.id),
      groupId: user.groupId,
    };

    onSubmit(newWorkspace);
  };

  if (loadingUsers) return <p>Loading users...</p>;
  if (errorUsers) return <p>Error loading users: {errorUsers}</p>;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3 className={styles.heading}>Add New Workspace</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Workspace Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <div className={styles.actions}>
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkspaceModal;
