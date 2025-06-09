import React, { useEffect, useState } from "react";
import Select from "react-select";
import styles from "./WorkspaceModal.module.css";

function WorkspaceModal({ onClose, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  // Selected owner (single) and members (multiple)
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Form fields
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

  // Filter users by role
  const adminUsers = users.filter((u) => u.role === "admin");
  const memberUsers = users.filter((u) => u.role === "member");

  // Map users to react-select options
  const ownerOptions = adminUsers.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const memberOptions = memberUsers.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedOwner) {
      alert("Please select an owner");
      return;
    }

    const newWorkspace = {
      id: `ws${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      ownerId: selectedOwner.value,
      memberIds: selectedMembers.map((m) => m.value),
      
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

          <label>
            Owner (Admins only):
            <Select
              options={ownerOptions}
              value={selectedOwner}
              onChange={setSelectedOwner}
              placeholder="Select owner"
              isClearable
            />
          </label>

          <label>
            Members (Members only):
            <Select
              options={memberOptions}
              value={selectedMembers}
              onChange={setSelectedMembers}
              placeholder="Select members"
              isMulti
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
