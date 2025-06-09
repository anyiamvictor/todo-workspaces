import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspacesList.module.css";
import WorkspaceModal from "../../../components/WorkspaceModal/WorkspaceModal";

function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // TODO: Replace with actual logged-in user later
  const currentUser = { id: "u1", role: "admin" };

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("http://localhost:3001/workspaces");
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        const data = await response.json();
        setWorkspaces(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleModalClose = () => setShowModal(false);

  const handleAddWorkspace = async (e) => {
    e.preventDefault();

    const form = e.target;
    const newWorkspace = {
      id: `ws${Date.now()}`, // quick unique id
      name: form.name.value,
      description: form.description.value,
      createdAt: new Date().toISOString(),
      owner: {
        id: form.ownerId.value,
        name: "Placeholder Name",
        role: "admin"
      },
      members: form.memberIds.value
        .split(",")
        .map((id) => ({ id: id.trim(), name: "Member", role: "member" })),
      projects: []
    };

    try {
      const response = await fetch("http://localhost:3001/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkspace)
      });

      if (!response.ok) throw new Error("Failed to add workspace");

      const added = await response.json();
      setWorkspaces((prev) => [...prev, added]);
      setShowModal(false);
    } catch (err) {
      console.error("Error adding workspace:", err.message);
    }
  };

  if (loading) return <p>Loading workspaces...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Workspaces</h2>

      {
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Workspace
        </button>
      }

      <ul className={styles.list}>
        {workspaces.map((workspace) => (
          <li key={workspace.id} className={styles.listItem}>
            <Link to={`/workspaces/${workspace.id}`} className={styles.link}>
              {workspace.name}
              <p className={styles.description}>{workspace.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {showModal && (
        <WorkspaceModal onClose={handleModalClose} onSubmit={handleAddWorkspace} />
      )}
    </div>
  );
}

export default WorkspacesList;
