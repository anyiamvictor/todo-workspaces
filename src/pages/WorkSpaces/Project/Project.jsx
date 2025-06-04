// src/pages/Workspaces/Project/Project.jsx
import React from "react";
import { useParams } from "react-router-dom";

function Project() {
  const { projectId } = useParams();

  return (
    <div>
      <h1>Project Overview</h1>
      <p>This is the overview page for project <b>{projectId}</b>.</p>
      {/* Add project details here */}
    </div>
  );
}

export default Project;
