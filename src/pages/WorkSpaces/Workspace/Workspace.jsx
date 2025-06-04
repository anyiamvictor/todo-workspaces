// src/pages/Workspaces/Workspace/Workspace.jsx
import React from "react";
import { useParams } from "react-router-dom";

function Workspace() {
  const { workspaceId } = useParams();

  return (
    <div>
      <h1>Workspace Overview</h1>
      <p>This is the overview page for workspace <b>{workspaceId}</b>.</p>
      {/* Add more workspace details here */}
    </div>
  );
}

export default Workspace;
