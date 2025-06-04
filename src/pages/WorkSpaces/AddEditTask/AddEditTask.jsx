// src/pages/Workspaces/AddEditTask/AddEditTask.jsx
import React from "react";
import { useParams } from "react-router-dom";

function AddEditTask() {
  const { workspaceId, projectId } = useParams();

  return (
    <div>
      <h1>Add / Edit Task</h1>
      <p>Adding or editing a task for project <b>{projectId}</b> in workspace <b>{workspaceId}</b>.</p>
      {/* Build your task form here */}
    </div>
  );
}

export default AddEditTask;
