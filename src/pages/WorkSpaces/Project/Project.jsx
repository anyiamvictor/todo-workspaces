import { useParams } from "react-router-dom";

function Project() {
  const { workspaceId, projectId } = useParams();

  return (
    <div>
      <h1>Project Page</h1>
      <p>Workspace ID: {workspaceId}</p>
      <p>Project ID: {projectId}</p>
    </div>
  );
}

export default Project;
