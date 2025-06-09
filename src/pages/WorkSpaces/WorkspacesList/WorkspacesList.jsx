import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspacesList.module.css";

function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p>Loading workspaces...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
    <h2 className={styles.heading}>Workspaces</h2>
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
  </div>
  );
}

export default WorkspacesList;
