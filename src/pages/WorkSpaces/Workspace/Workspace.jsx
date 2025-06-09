// src/pages/Workspaces/Workspace/Workspace.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./Workspace.module.css";


function Workspace() {
  const { workspaceId } = useParams();
  const projects = mockProjectsByWorkspace[workspaceId] || [];

  return (
    <div className={styles.container}>
      <h3>Projects in Workspace: {workspaceId}</h3>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id} className={styles.listItem}>
              <Link to={`projects/${project.id}`}>{project.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Workspace;
