import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./WorkspacesList.module.css";
import WorkspaceModal from "../../../components/WorkspaceModal/WorkspaceModal";
import { useAuth } from "../../../contexts/AuthContext/AuthContext";

function WorkspacesList() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/workspaces?groupId=${user.groupId}`
        );
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        const data = await response.json();
        setWorkspaces(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.groupId) fetchWorkspaces();
  }, [user?.groupId]);

  const handleModalClose = () => setShowModal(false);

  const handleAddWorkspace = async (workspace) => {
    const workspaceWithGroup = {
      ...workspace,
      groupId: user.groupId,
      ownerId: user.id,
    };

    try {
      const response = await fetch("http://localhost:3001/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspaceWithGroup),
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

  const requestDelete = (workspace) => {
    const isAuthorized =
      user.role === "admin" || user.id === workspace.ownerId;

    if (!isAuthorized) {
      setWorkspaceToDelete({
        ...workspace,
        blocked: true,
      });
      setShowConfirm(true);
      return;
    }

    setWorkspaceToDelete(workspace);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    const workspace = workspaceToDelete;
    try {
      const projectsRes = await fetch(`http://localhost:3001/projects?workspaceId=${workspace.id}`);
      const projects = await projectsRes.json();

      for (const project of projects) {
        const tasksRes = await fetch(`http://localhost:3001/tasks?projectId=${project.id}`);
        const tasks = await tasksRes.json();
        for (const task of tasks) {
          await fetch(`http://localhost:3001/tasks/${task.id}`, { method: "DELETE" });
        }
        await fetch(`http://localhost:3001/projects/${project.id}`, { method: "DELETE" });
      }

      await fetch(`http://localhost:3001/workspaces/${workspace.id}`, { method: "DELETE" });

      setWorkspaces(prev => prev.filter(ws => ws.id !== workspace.id));
      setShowConfirm(false);
      setWorkspaceToDelete(null);
    } catch (err) {
      console.error("Error deleting workspace:", err.message);
      alert("Error deleting workspace: " + err.message);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setWorkspaceToDelete(null);
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
            <button
              className={styles.deleteIconBtn}
              onClick={() => requestDelete(workspace)}
              title="Delete Workspace"
            >
              ✖️
            </button>
            <Link to={`/workspaces/${workspace.id}`} className={styles.link}>
              {workspace.name}
              <p className={styles.description}>{workspace.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {showModal && (
        <WorkspaceModal
          user={user}
          onClose={handleModalClose}
          onSubmit={handleAddWorkspace}
        />
      )}

      {showConfirm && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
          {workspaceToDelete?.blocked ? (
  <>
    <p>You don’t have clearance to delete this workspace. Please contact the owner.</p>
    <div className={styles.confirmActions}>
      <button onClick={cancelDelete}>Okay</button>
    </div>
  </>
) : (
  <>
    <p>
      Are you sure you want to delete{" "}
      <strong>{workspaceToDelete.name}</strong> and all associated
      projects and tasks?
    </p>
    <div className={styles.confirmActions}>
      <button onClick={confirmDelete}>Yes, Delete</button>
      <button onClick={cancelDelete}>Cancel</button>
    </div>
  </>
)}

          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspacesList;
