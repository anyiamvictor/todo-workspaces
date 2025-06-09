// src/pages/Workspaces/WorkspaceList/WorkspaceList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspacesList.module.css";

function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const response = await fetch("http://localhost:3001/workspaces");
        if (!response.ok) {
          throw new Error("Failed to fetch workspaces");
        }
        const data = await response.json();
        setWorkspaces(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspaces();
  }, []);

  if (loading) return <p>Loading workspaces...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1>Workspaces</h1>
      <ul className={styles.list}>
        {workspaces.map((ws) => (
          <li key={ws.id} className={styles.workspaceItem}>
            <Link to={`/workspaces/${ws.id}`}>
              <h2>{ws.name}</h2>
            </Link>
            <p>{ws.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WorkspacesList;
