import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Workspace.module.css";

function Workspace() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`http://localhost:3001/workspaces/${workspaceId}`);
        const data = await res.json();
        setWorkspace(data);
      } catch (err) {
        console.error("Failed to fetch workspace:", err);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  if (!workspace) return <p>Loading workspace...</p>;

  return (
    <div className={styles.container}>
    <div className={styles.header}>
      <h2 className={styles.title}>{workspace.name}</h2>
      <p className={styles.description}>{workspace.description}</p>
      <p className={styles.meta}>
        Owner: {workspace.owner?.name} | Created: {new Date(workspace.createdAt).toLocaleDateString()}
      </p>
    </div>

    {/* We'll add project listing here next */}
  </div>
  );
}

export default Workspace;
