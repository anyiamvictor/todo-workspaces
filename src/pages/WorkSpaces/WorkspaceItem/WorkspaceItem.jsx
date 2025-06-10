import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./WorkspaceItem.module.css";

function WorkspaceItem() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [ownerName, setOwnerName] = useState("Loading...");

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`http://localhost:3001/workspaces/${workspaceId}`);
        const data = await res.json();
        setWorkspace(data);

        if (data.ownerId) {
          const userRes = await fetch(`http://localhost:3001/users/${data.ownerId}`);
          const userData = await userRes.json();
          setOwnerName(userData.name);
        } else {
          setOwnerName("Unknown Owner");
        }
      } catch (err) {
        console.error("Failed to fetch workspace or owner:", err);
        setOwnerName("Failed to load owner");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  if (!workspace) return <p>Loading workspace...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* <h2 className={styles.title}>{workspace.name}</h2> */}
        <p className={styles.description}>{workspace.description}</p>
        <p className={styles.meta}>
          Owner: {ownerName} | Created: {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default WorkspaceItem;
