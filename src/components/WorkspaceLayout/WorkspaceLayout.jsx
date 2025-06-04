// src/pages/Workspaces/WorkspaceLayout/WorkspaceLayout.jsx
import React from "react";
import { Outlet, useParams, Link } from "react-router-dom";

function WorkspaceLayout() {
  const { workspaceId } = useParams();

  // You could fetch workspace data here or get it from context/store

  return (
    <div style={{ border: "2px solid #007acc", padding: "20px" }}>
      <h2>Workspace ID: {workspaceId}</h2>
      {/* Example sidebar or navigation */}
      <nav style={{ marginBottom: "20px" }}>
        <Link to={`/workspaces/${workspaceId}`}>Overview</Link> |{" "}
        <Link to={`/workspaces/${workspaceId}/projects/p1`}>Project p1</Link> |{" "}
        <Link to={`/workspaces/${workspaceId}/projects/p1/add-task`}>Add Task</Link>
      </nav>

      {/* Nested child routes will render here */}
      <Outlet />
    </div>
  );
}

export default WorkspaceLayout;
