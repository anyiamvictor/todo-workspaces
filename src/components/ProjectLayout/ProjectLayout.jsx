// src/pages/Workspaces/ProjectLayout/ProjectLayout.jsx
import React from "react";
import { Outlet, useParams, Link } from "react-router-dom";

function ProjectLayout() {
  const { workspaceId, projectId } = useParams();

  // Fetch or get project info here

  return (
    <div style={{ border: "2px dashed #00a854", padding: "15px" }}>
      <h3>
        Workspace: {workspaceId} — Project ID: {projectId}
      </h3>
      {/* Navigation inside project */}
      <nav style={{ marginBottom: "15px" }}>
        <Link to={`/workspaces/${workspaceId}/projects/${projectId}`}>
          Project Overview
        </Link>{" "}
        |{" "}
        <Link to={`/workspaces/${workspaceId}/projects/${projectId}/add-task`}>
          Add Task
        </Link>
      </nav>

      {/* Nested child routes like TaskDetail or AddEditTask */}
      <Outlet />
    </div>
  );
}

export default ProjectLayout;
