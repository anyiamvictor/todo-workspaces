import  { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspacesList.module.css";
import WorkspaceModal from "../../../components/WorkspaceModal/WorkspaceModal";

function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("http://localhost:3001/workspaces");
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        const data = await response.json();
        setWorkspaces(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleModalClose = () => setShowModal(false);

  const handleAddWorkspace = async (workspace) => {
    try {
      const response = await fetch("http://localhost:3001/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspace),
      });

      if (!response.ok) throw new Error("Failed to add workspace");

      const added = await response.json();
      setWorkspaces((prev) => [...prev, added]);
      setShowModal(false);
    } catch (err) {
      console.error("Error adding workspace:", err.message);
      alert("Error creating workspace: " + err.message);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading workspaces...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Workspaces</h2>

      <div className={styles.wrkspctop}>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Workspace
        </button>

        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <ul className={styles.list}>
        {filteredWorkspaces.map((workspace) => (
          <li key={workspace.id} className={styles.listItem}>
            <Link to={`/workspaces/${workspace.id}`} className={styles.link}>
              {workspace.name}
              <p className={styles.description}>{workspace.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {showModal && (
        <WorkspaceModal onClose={handleModalClose} onSubmit={handleAddWorkspace} />
      )}
    </div>
  );
}

export default WorkspacesList;
