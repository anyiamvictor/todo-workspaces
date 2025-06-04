import { useParams } from "react-router-dom";

function TaskDetail() {
  const { workspaceId, projectId, taskId } = useParams();

  return (
    <div>
      <h1>Task Detail</h1>
      <p>Workspace ID: {workspaceId}</p>
      <p>Project ID: {projectId}</p>
      <p>Task ID: {taskId}</p>
    </div>
  );
}

export default TaskDetail;
