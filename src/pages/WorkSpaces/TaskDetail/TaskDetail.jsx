// src/pages/Workspaces/TaskDetail/TaskDetail.jsx
import React from "react";
import { useParams } from "react-router-dom";

function TaskDetail() {
  const { taskId } = useParams();

  return (
    <div>
      <h1>Task Detail</h1>
      <p>Details for task <b>{taskId}</b>.</p>
      
      {/* Show task details and status here */}
    </div>
  );
}

export default TaskDetail;
