import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // added useNavigate
import styles from "./WorkspacesList.module.css";
import WorkspaceModal from "../../../components/WorkspaceModal/WorkspaceModal";
import { useAuth } from "../../../contexts/AuthContext/AuthContextFirebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc, // added getDoc for single doc fetch
} from "firebase/firestore";
import { db } from "../../../components/firebaseConfig";
import SkeletonBlock from "../../../components/SkeletonBlock/SkeletonBlock";

function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  
  // NEW modal state for "not authorized"
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  // NEW: Store workspace name for modal display
  const [deniedWorkspaceName, setDeniedWorkspaceName] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate(); // NEW: for programmatic navigation

  // useEffect(() => {
  //   const fetchWorkspaces = async () => {
  //     try {
  //       const snapshot = await getDocs(
  //         query(collection(db, "workspaces"), where("groupId", "==", user.groupId))
  //       );
  //       const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  //       setWorkspaces(data);
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (user?.groupId) fetchWorkspaces();
  // }, [user?.groupId]);

  useEffect(() => {
  if (!user?.groupId) return;

  const q = query(collection(db, "workspaces"), where("groupId", "==", user.groupId));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const updatedWorkspaces = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkspaces(updatedWorkspaces);
      setLoading(false);
    },
    (err) => {
      setError(err.message);
      setLoading(false);
    }
    );
    

  return () => unsubscribe();
}, [user?.groupId]);

  const handleModalClose = () => setShowModal(false);

  // const handleAddWorkspace = (newWorkspace) => {
  //   setWorkspaces((prev) => [...prev, newWorkspace]);
  // };

  const requestDelete = (workspace) => {
    const isAuthorized = user.role === "admin" || user.uid === workspace.ownerId;

    if (!isAuthorized) {
      setWorkspaceToDelete({ ...workspace, blocked: true });
      setShowConfirm(true);
      return;
    }

    setWorkspaceToDelete(workspace);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    const workspace = workspaceToDelete;
    try {
      const projectsSnapshot = await getDocs(
        query(collection(db, "projects"), where("workspaceId", "==", workspace.id))
      );
      const projects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      for (const project of projects) {
        const tasksSnapshot = await getDocs(
          query(collection(db, "tasks"), where("projectId", "==", project.id))
        );
        const tasks = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        for (const task of tasks) {
          await deleteDoc(doc(db, "tasks", task.id));
        }

        await deleteDoc(doc(db, "projects", project.id));
      }

      await deleteDoc(doc(db, "workspaces", workspace.id));

      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspace.id));
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

  // NEW function to handle click on workspace link with access check
  const handleWorkspaceClick = async (e, workspace) => {
    e.preventDefault();

    try {
      const workspaceRef = doc(db, "workspaces", workspace.id);
      const workspaceSnap = await getDoc(workspaceRef);

      if (!workspaceSnap.exists()) {
        alert("Workspace not found.");
        return;
      }

      const workspaceData = workspaceSnap.data();

      // Check if current user is in memberIds array
      if (workspaceData.memberIds && workspaceData.memberIds.includes(user.uid)) {
        // User authorized, navigate to workspace
        navigate(`/workspaces/${workspace.id}`);
      } else {
        // Not authorized, show modal
        setDeniedWorkspaceName(workspace.name);
        setShowAccessDeniedModal(true);
      }
    } catch (err) {
      console.error("Error checking workspace membership:", err);
      alert("Error checking workspace membership: " + err.message);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap:"20px",
      justifyContent: "center",
      height: "100vh",
      width: "100%",   // full width
    }}>
      <SkeletonBlock width="80%" height="20px" />
      <SkeletonBlock width="90%" height="20px" />
      <SkeletonBlock width="70%" height="20px" />
      <SkeletonBlock width="60%" height="50px" />
      <SkeletonBlock width="40%" height="20px" />
      <SkeletonBlock width="60%" height="30px" />
      <SkeletonBlock width="80%" height="20px" />
      <SkeletonBlock width="90%" height="20px" />
      <SkeletonBlock width="70%" height="20px" />
      <SkeletonBlock width="60%" height="50px" />
      <SkeletonBlock width="40%" height="20px" />
      <SkeletonBlock width="60%" height="30px" />
    </div>
  );
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Workspaces</h2>

      <div className={styles.wrkspctop}>
        {user.role === "supervisor" && (
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add Workspace
          </button>
        )}

        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <ul className={styles.list}>
        {filteredWorkspaces.length === 0 ? (
          <p className={styles.noWorkspacesMsg}>
            No workspaces found. Click “+ Add Workspace” to get started. or Wait for a Supervisor to Create one
          </p>
        ) : (
          filteredWorkspaces.map((workspace) => (
            <li key={workspace.id} className={styles.listItem}>
              {user.role === "supervisor" && (
                <button
                  className={styles.deleteIconBtn}
                  onClick={() => requestDelete(workspace)}
                  title="Delete Workspace"
                >
                  ✖️
                </button>
              )}
              {/* UPDATED: replaced Link with <a> and onClick handler */}
              <a
                href={`/workspaces/${workspace.id}`}
                className={styles.link}
                onClick={(e) => handleWorkspaceClick(e, workspace)}
              >
                {workspace.name}
                <p className={styles.description}>
                  {workspace.description.split(' ').length > 8
                    ? workspace.description.split(' ').slice(0, 8).join(' ') + '...'
                    : workspace.description}
                </p>
              </a>
            </li>
          ))
        )}
      </ul>

      {showModal && (
        <WorkspaceModal
          user={user}
          onClose={handleModalClose}
          // onSubmit={handleAddWorkspace}
          onSubmit={() => setShowModal(false)}
        />
      )}

      {showConfirm && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            {workspaceToDelete?.blocked ? (
              <>
                <p>
                  You don’t have clearance to delete this workspace. Please contact the
                  owner.
                </p>
                <div className={styles.confirmActions}>
                  <button onClick={cancelDelete}>Okay</button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Are you sure you want to delete <strong>{workspaceToDelete.name}</strong> and
                  all associated projects and tasks?
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

      {/* NEW: Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmBox}>
            <p>
              You’re not part of the workspace <strong>{deniedWorkspaceName}</strong>. <br />
              Please contact the admin for access.
            </p>
            <div className={styles.confirmActions}>
              <button onClick={() => setShowAccessDeniedModal(false)}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspacesList;
