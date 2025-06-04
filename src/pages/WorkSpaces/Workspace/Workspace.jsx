import { useParams } from "react-router-dom";

function Workspace() {
  const { workspaceId } = useParams();

  return (
    <div>
      <h1>Workspace Page</h1>
      <p>Workspace ID: {workspaceId}</p>
      {/* Later: Fetch workspace details using this ID */}
    </div>
  );
}

export default Workspace;
