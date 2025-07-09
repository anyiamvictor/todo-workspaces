// Something is wrong. when i create a workspce with an account, the second account also have the workspace. 
// i think it has to do with how the group fetching is done when creating workspace from admin panel


import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import styles from "./Admin.module.css";
import WorkspaceModal from "../../components/WorkspaceModal/WorkspaceModal";
import AddProjectModal from "../../components/AddProjectModal/AddProjectModal";
import AddEditTaskModal from "../../components/AddEditTaskModal/AddEditTaskModal";
// import TaskForm from "../s../components/AddEditTaskModal/TaskForm";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../components/firebaseConfig"; // adjust if path differs
import TextSpinner from "../../components/TextSpinner/TextSpinner";
import MemberDetailsPerformance from "./MemberDetailsPerformance";
import {motion, AnimatePresence} from "framer-motion"; // Import framer-motion for animations


function Admin() {
  const { groupId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newInviteCode, setNewInviteCode] = useState("");
  const [updatingInviteCode, setUpdatingInviteCode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectWorkspaceId, setProjectWorkspaceId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
const [taskToEdit, setTaskToEdit] = useState(null);
const [taskProjectId, setTaskProjectId] = useState(null);
const [showProjectDeleteModal, setShowProjectDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showTaskDeleteModal, setShowTaskDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUsers, setShowUsers] = useState(false);


  
  
  
  


useEffect(() => {
  if (!groupId || !user?.uid) return;

  fetchGroupData(); // Initial load for all data once

  // Real-time listeners
  const unsubGroup = onSnapshot(doc(db, "groups", groupId), (docSnap) => {
    if (docSnap.exists()) {
      const groupData = docSnap.data();
      if (groupData.adminId !== user.uid) {
        setError("Unauthorized or group not found.");
        return;
      }
      setGroup(groupData);
      setNewInviteCode(groupData.inviteCode || "");
    }
  });

  const unsubUsers = onSnapshot(
    query(collection(db, "users"), where("groupId", "==", groupId)),
    (querySnap) => {
      const userList = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    }
  );

  return () => {
    unsubGroup();
    unsubUsers();
  };
}, [groupId, user?.uid ]);
//next add snap shot for workgroups, task, project 

  const fetchGroupData = async () => {
    try {
      // const groupRes = await fetch(`http://localhost:3001/groups/${groupId}`);
      // const groupData = await groupRes.json();
  
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const groupData = groupSnap.exists() ? groupSnap.data() : null;
  
      if (!groupData || groupData.adminId !== user.uid) {
        setError("Unauthorized or group not found.");
        return;
      }
  
      // const [wsRes, usersRes] = await Promise.all([
      //   fetch(`http://localhost:3001/workspaces?groupId=${groupId}`),
      //   fetch(`http://localhost:3001/users?groupId=${groupId}`)
      // ]);
  
      const [wsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(query(collection(db, "workspaces"), where("groupId", "==", groupId))),
        getDocs(query(collection(db, "users"), where("groupId", "==", groupId))),
      ]);
  
      const wsData = wsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      setGroup(groupData);
      setWorkspaces(wsData);
      setUsers(userData);
      setNewInviteCode(groupData.inviteCode || "");
  
      // const projRes = await fetch(`http://localhost:3001/projects`);
      // const projData = await projRes.json();
      const allProjectsSnap = await getDocs(collection(db, "projects"));
      const projData = allProjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const groupProjects = projData.filter(p => wsData.some(ws => ws.id === p.workspaceId));
      setProjects(groupProjects);
  
      // const taskRes = await fetch(`http://localhost:3001/tasks`);
      // const taskData = await taskRes.json();
      const allTasksSnap = await getDocs(collection(db, "tasks"));
      const taskData = allTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const groupTasks = taskData.filter(t =>
        groupProjects.some(p => p.id === t.projectId)
      );
      setTasks(groupTasks);
  
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  

  const fetchUsersOnly = async () => {
    try {
      // const usersRes = await fetch(`http://localhost:3001/users?groupId=${groupId}`);
      // const userData = await usersRes.json();
      const snapshot = await getDocs(query(collection(db, "users"), where("groupId", "==", groupId)));
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
    } catch (err) {
      console.error("Failed to refresh users:", err);
    }
  };
  

  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (loading) return  <TextSpinner/>;
  if (error) return <p>{error}</p>;

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: newStatus });
  
    fetchUsersOnly();
  };
  

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === "supervisor" ? "member" : "supervisor"; 
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: newRole });
  
    fetchUsersOnly();
  };
  
  // accordeing to firebase authentication, you can only delete the user from the db
  // but not from the firebase authentication, so we will just delete the user from the db
  //however to delete from firebase authentication, you need to use the firebase admin sdk with cloud functions
  const deleteUser = async (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowUserDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
  
    try {
    
      await deleteDoc(doc(db, "users", userToDelete.id));
      fetchUsersOnly();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("An error occurred while deleting the user.");
    } finally {
      setShowUserDeleteModal(false);
      setUserToDelete(null);
    }
  };
  
  

  const updateInviteCode = async () => {
    if (!newInviteCode.trim()) return;
  
    setUpdatingInviteCode(true);
    try {
      // const res = await fetch(`http://localhost:3001/groups/${groupId}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ inviteCode: newInviteCode.trim() }),
      // });
  
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, { inviteCode: newInviteCode.trim() });
  
      setGroup((prev) => ({ ...prev, inviteCode: newInviteCode.trim() }));
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the invite code.");
    } finally {
      setUpdatingInviteCode(false);
    }
  };
  

  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const sortedUsers = [...users].sort((a, b) => (b.isOnline === true) - (a.isOnline === true));

  const handleClose = () => {
    setShowModal(false);
  };
  
  const handleSubmit = async (workspace) => {
    if (isSubmitting) return ;
    setIsSubmitting(true);
    try {
    
      setWorkspaces((prev) => [...prev, workspace]);
      setShowModal(false);
  
    } catch (err) {
      console.error("Error adding workspace:", err.message);
      alert("Error creating workspace: " + err.message);
    }   finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (projectData) => {
    try {
      const newProject = {
        ...projectData,
        workspaceId: projectWorkspaceId,
      };
  
      // const res = await fetch("http://localhost:3001/projects", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(newProject),
      // });
      // const created = await res.json();
  
      const docRef = await addDoc(collection(db, "projects"), newProject);
      const created = { id: docRef.id, ...newProject };
  
      setProjects((prev) => [...prev, created]);
      setShowProjectModal(false);
      setProjectWorkspaceId(null);
    } catch (err) {
      console.error(err);
      alert("Could not create project.");
    }
  };
  
  const confirmDeleteWorkspace = (workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
  };
  
  const deleteWorkspaceAndChildren = async () => {
    if (!workspaceToDelete) return;
  
    try {
      const { id: workspaceId } = workspaceToDelete;
  
      // Delete tasks
      const tasksToDelete = tasks.filter((t) =>
        projects.find((p) => p.workspaceId === workspaceId && p.id === t.projectId)
      );
      await Promise.all(
        tasksToDelete.map((t) =>
          // fetch(`http://localhost:3001/tasks/${t.id}`, { method: "DELETE" })
          deleteDoc(doc(db, "tasks", t.id))
        )
      );
  
      // Delete projects
      const projectsToDelete = projects.filter((p) => p.workspaceId === workspaceId);
      await Promise.all(
        projectsToDelete.map((p) =>
          // fetch(`http://localhost:3001/projects/${p.id}`, { method: "DELETE" })
          deleteDoc(doc(db, "projects", p.id))
        )
      );
  
      // Delete workspace
      // await fetch(`http://localhost:3001/workspaces/${workspaceId}`, { method: "DELETE" });
      await deleteDoc(doc(db, "workspaces", workspaceId));
  
      // Update local state
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
      setProjects((prev) => prev.filter((p) => p.workspaceId !== workspaceId));
      setTasks((prev) =>
        prev.filter((t) => !projectsToDelete.some((p) => p.id === t.projectId))
      );
  
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    } catch (err) {
      console.error("Error deleting workspace:", err);
      alert("Failed to delete workspace and its children.");
    }
  };

  const confirmDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowProjectDeleteModal(true);
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
  
    // await fetch(`http://localhost:3001/projects/${projectToDelete.id}`, { method: "DELETE" });
    await deleteDoc(doc(db, "projects", projectToDelete.id));
  
    setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    setShowProjectDeleteModal(false);
    setProjectToDelete(null);
  };
  
  
  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowTaskDeleteModal(true);
  };
  
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
  
    // await fetch(`http://localhost:3001/tasks/${taskToDelete.id}`, { method: "DELETE" });
    await deleteDoc(doc(db, "tasks", taskToDelete.id));
  
    setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    setShowTaskDeleteModal(false);
    setTaskToDelete(null);
  };
  
  
  const handleTaskSuccess = async () => {
    // const res = await fetch("http://localhost:3001/tasks");
    // const data = await res.json();
    const snapshot = await getDocs(collection(db, "tasks"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    setTasks(data);
    setShowTaskModal(false);
    setTaskToEdit(null);
    setTaskProjectId(null);
  };
  
  
  const openProjectModal = (workspaceId) => {
    setProjectWorkspaceId(workspaceId);
    setShowProjectModal(true);
  };
  
  const openAddTaskModal = (projectId) => {
    setTaskProjectId(projectId);
    setTaskToEdit(null);
    setShowTaskModal(true);
  };
  
  const openEditTaskModal = (task) => {
    setTaskProjectId(task.projectId);
    setTaskToEdit(task);
    setShowTaskModal(true);
  };
  

  return (
    
    <div className={styles.adminContainer}>
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>
              Are you sure you want to delete workspace <strong>{workspaceToDelete?.name}</strong> and all its projects and tasks?
            </p>
            <div className={styles.modalButtons}>
              <button onClick={deleteWorkspaceAndChildren}>Yes, Delete</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.headerRow}>
       
        <h1 className={styles.adminHeader}>Admin Panel for {group?.name}</h1>
        <div className={styles.userHeader}>
          <button onClick={() => { logout(); navigate("/auth"); }} className={styles.logoutButton}>
            Logout
          </button>
          <button>Delete Account</button>
        </div>
      </div>

      <p className={styles.adminWelcome}>Welcome, {user.name}!</p>

      <section className={styles.inviteCode}>
        <h2>Group Invite Code</h2>
        <p>This code is required by new users to join your group.</p>
        <input
          type="text"
          value={newInviteCode}
          onChange={(e) => setNewInviteCode(e.target.value)}
          placeholder="Enter invite code"
        />
        <button onClick={updateInviteCode} disabled={updatingInviteCode}>
          {updatingInviteCode ? "Updating..." : "Save Invite Code"}
        </button>
      </section>

      <section className={styles.section}>
        <h2>Workspaces</h2>
        <button onClick={() => setShowModal(true)}>+ Create Workspace</button>
        {showModal && <WorkspaceModal user={user} onClose={handleClose} onSubmit={handleSubmit} />}
        {showProjectModal && (<AddProjectModal onClose={() => setShowProjectModal(false)} onSubmit={handleProjectSubmit} defaultData={{ assignedUserIds: [] }} />
        )}

        <ul>
          {workspaces.map((ws) => (
            <li key={ws.id} className={styles.workspaceItem}>
              <strong>{ws.name}</strong> - {ws.description}
              <button onClick={() => openProjectModal(ws.id)}>+ Create Project</button>

              <button onClick={() => confirmDeleteWorkspace(ws)} className={styles.deleteButton}>
                🗑️
              </button>
            </li>
          ))}
        </ul>

      </section>

      
      <section className={styles.section}>
        <h2>Projects & Tasks</h2>
        {workspaces.map((ws) => (
          <div key={ws.id}>
            <h3>{ws.name}</h3>
            <ul>
              {projects
                .filter((p) => p.workspaceId === ws.id)
                .map((p) => (
                  <li key={p.id}>
                    <strong>📁 {p.name}</strong> – {p.description} [{p.status}] <button onClick={() => openAddTaskModal(p.id)}>+ Add Task</button>
                    <button onClick={() => confirmDeleteProject(p)}> 🗑️ </button>
                    <ul>
                      {tasks
                        .filter((t) => t.projectId === p.id)
                        .map((t) => (
                          <li key={t.id}>
                            📝 <strong>{t.title}</strong> – {t.status} – {t.priority}
                            <button onClick={() => openEditTaskModal(t)}>Edit</button>
                            <button onClick={() => confirmDeleteTask(t)}>🗑️</button>
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>


      {showTaskModal && (
        <AddEditTaskModal
          projectId={taskProjectId}
          task={taskToEdit}
          onClose={() => setShowTaskModal(false)}
          onSuccess={handleTaskSuccess}
        />
      )}

      {showProjectDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to delete project "{projectToDelete?.name}"?</p>
            <button onClick={handleDeleteProject}>Yes, Delete</button>
            <button onClick={() => setShowProjectDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showTaskDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <p>Are you sure you want to delete task "{taskToDelete?.title}"?</p>
            <button onClick={handleDeleteTask}>Yes, Delete</button>
            <button onClick={() => setShowTaskDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}





      <section className={styles.section}>
        <h2>Manage Users</h2>
        <button onClick={() => setShowUsers((prev) => !prev)}>
          {showUsers ? "Hide Users ▲" : "Show Users ▼"}
        </button>

        <AnimatePresence>
  {showUsers && (
    <motion.ul
      className={styles.userList}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >{sortedUsers.map((u) => (
              u.id === user?.uid && user?.role === "admin" ? null : (
                <li className={styles.userCard} key={u.id}>
                  <div className={styles.userDetails}>
                    <span><img
                      src={u.avatarUrl || "/default-avatar.png"}
                      alt={`${u.name}'s avatar`}
                      className={styles.avatar}
                    /></span>
                  
                    <p className={styles.userName}><strong>Name:</strong>{u.name}</p>
                    <p className={styles.userEmail}><strong>Email:</strong>{u.email}</p>
                    <p className={styles.userMeta}>
                      <span className={styles.userRole}><strong>Role:</strong>{u.role}</span> –{" "}
                      <span className={u.status === "active" ? styles.activeStatus : styles.inactiveStatus}>
                        {u.status}
                      </span>
                    </p>
                  </div>

              
              
                  <div className={styles.actions}>
                    <>
                      <button onClick={() => toggleUserStatus(u.id, u.status)}>
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => toggleUserRole(u.id, u.role)}>
                        {u.role === "supervisor" ? "Unmake Supervisor" : "Make Supervisor"}
                      </button>
                      <button onClick={() => deleteUser(u.id, u.name)}>🗑️ Delete User</button>
                      <button onClick={() => {
                        setSelectedUserId(u.id);
                        setShowPerformanceModal(true);
                      }}>Performance</button>
                    </>
                  </div>

              
                  {/* Online status */}
                  <div className={styles.statusBadge}>
                    <span
                      className={styles.statusDot}
                      style={{ backgroundColor: u.isOnline ? "green" : "red" }}
                    ></span>
                    {u.isOnline
                      ? "Online"
                      : `Offline – Last seen: ${formatLastSeen(u.lastSeen)}`}
                  </div>

                  {showUserDeleteModal && (
                    <div className={styles.modalOverlay}>
                      <div className={styles.modal}>
                        <p>
                          Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
                        </p>
                        <div className={styles.modalButtons}>
                          <button onClick={confirmDeleteUser}>Yes, Delete</button>
                          <button onClick={() => setShowUserDeleteModal(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                </li>)
            
            ))}
            </motion.ul>
        )}
</AnimatePresence>
        {/* display user details/perfomance */}
        {showPerformanceModal && selectedUserId && (
          <MemberDetailsPerformance
            userId={selectedUserId}
            onClose={() => {
              setSelectedUserId(null);
              setShowPerformanceModal(false);
            }}
          />
        )}

      </section>


    </div>
  );
}

export default Admin;