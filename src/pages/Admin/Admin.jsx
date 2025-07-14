

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
import { httpsCallable } from "firebase/functions";
import { functions } from "../../components/firebaseConfig";
import toast from 'react-hot-toast';

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
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [showProjectsSection, setShowProjectsSection] = useState(true); // Toggle for full section
  const [expandedProjects, setExpandedProjects] = useState({}); // Toggle per project
  const [deletingUser, setDeletingUser] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
const [confirmDeleteText, setConfirmDeleteText] = useState("");
const [deletingGroup, setDeletingGroup] = useState(false);

const [allProjects, setAllProjects] = useState([]);
const [allTasks, setAllTasks] = useState([]);

  useEffect(() => {
  if (!groupId) return;

  const q = query(
    collection(db, 'workspaces'),
    where('groupId', '==', groupId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkspaces(data);
  });

  return () => unsubscribe();
}, [groupId]);

  
useEffect(() => {
  if (!groupId || !user?.uid) return;


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

  const unsubProjects = onSnapshot(
    collection(db, "projects"),
    (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProjects(all);
    },
    (err) => console.error("Project snapshot error:", err)
  );

  const unsubTasks = onSnapshot(
    collection(db, "tasks"),
    (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTasks(all);
    },
    (err) => console.error("Task snapshot error:", err)
  );

  return () => {
    unsubGroup();
    unsubUsers();
    unsubProjects();
    unsubTasks();
  };
}, [groupId, user?.uid]);


useEffect(() => {
  if (!workspaces.length || !allProjects.length) return;

  const filtered = allProjects.filter((p) =>
    workspaces.some(ws => ws.id === p.workspaceId)
  );
  setProjects(filtered);
}, [workspaces, allProjects]);


useEffect(() => {
  if (!projects.length || !allTasks.length) return;

  const filtered = allTasks.filter((t) =>
    projects.some(p => p.id === t.projectId)
  );
  setTasks(filtered);
}, [projects, allTasks]);


  const fetchGroupData = async () => {
    try {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const groupData = groupSnap.exists() ? groupSnap.data() : null;

      if (!groupData || groupData.adminId !== user.uid) {
        setError("Unauthorized or group not found.");
        return;
      }

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

    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  fetchGroupData();
  

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
  if (error) return toast.error(`${error.message}`);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: newStatus });
  
    fetchUsersOnly();
  };
  

  // const toggleUserRole = async (userId, currentRole) => {
  //   const newRole = currentRole === "supervisor" ? "member" : "supervisor"; 
  //   const userRef = doc(db, "users", userId);
  //   await updateDoc(userRef, { role: newRole });
  
  //   fetchUsersOnly();
  // };
  const toggleUserRole = async (userId, currentRole) => {
  const newRole = currentRole === "supervisor" ? "member" : "supervisor";

  const assignRoleFn = httpsCallable(functions, "assignRole");
  try {
   await assignRoleFn({ targetUid: userId, newRole });
    // await updateDoc(doc(db, "users", userId), { role: newRole });
    toast.success(`Role updated to ${newRole}`);
    fetchUsersOnly();
  } catch (err) {
    console.error("Failed to assign role:", err);
    toast.error("Failed to change role. You must be an admin.");
  }
};
 

  const deleteUser = async (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowUserDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    // deletes user in fire store db and firebase auth

    if (!userToDelete) return;
    setDeletingUser(true);
    console.log(userToDelete)
  
    try {
    
      const deleteUserFn = httpsCallable(functions, "deleteUserCompletely");
      await deleteUserFn({ uid: userToDelete.id });
      fetchUsersOnly();
      return   toast.success(`User "${userToDelete.name}" deleted successfully`)

        
    } catch (err) {
      console.error("Failed to delete user:", err);
      return   toast.error(`User "${userToDelete.name}" was NOT deleted. An Error Occoured`)

    } finally {
      setShowUserDeleteModal(false);
      setUserToDelete(null);
    setDeletingUser(false);

    }
  };

   
  
const handleGroupDelete = async () => {
  setDeletingGroup(true);
  try {
    const fn = httpsCallable(functions, "deleteGroupCompletely");
    await fn();
    toast.success("Group deleted successfully.");
    await logout();
    navigate("/auth");
  } catch (err) {
    console.error("Group deletion failed:", err);
    toast.error("Failed to delete group. Please try again.");
  } finally {
    setDeletingGroup(false);
    setConfirmDeleteText(""); // Clear input
    setShowDeleteGroupModal(false);
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
      toast.error("An error occurred while updating the invite code. Please Try again")
      // alert("An error occurred while updating the invite code.");
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
      toast.error("Error creating workspace: " + err.message);
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
      toast.error("Could not create project. Please Try again");
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
      toast.error("Failed to delete workspace and its children.Try again");
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
  
    
const toggleProjectVisibility = (projectId) => {
  setExpandedProjects((prev) => ({
    ...prev,
    [projectId]: !prev[projectId],
  }));
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

       
      <h1 className={styles.adminHeader}>Admin Panel for {group?.name}</h1>
      <div className={styles.userHeader}>
        <p className={styles.adminWelcome}>Welcome, {user.name}!</p>
        <button onClick={() => { logout(); navigate("/auth"); }} className={styles.logoutButton}>
          Logout
        </button>
      </div>


      <section className={styles.inviteCode}>
        <h2>Group Invite Code</h2>
        <p>This code is required by new users to join your group.</p>
        <div className={styles.inviteActions}>
          <input
            type="text"
            value={newInviteCode}
            onChange={(e) => setNewInviteCode(e.target.value)}
            placeholder="Enter invite code"
          />
          <button onClick={updateInviteCode} disabled={updatingInviteCode}>
            {updatingInviteCode ? "Updating..." : "Save Invite Code"}
          </button>
        </div>
   
      </section>

    
      <section className={styles.section}>
        <h2>Manage Workspaces</h2>
        <div className={styles.userHeader}>
          <button onClick={() => setShowWorkspaces(!showWorkspaces)}>
            {showWorkspaces ? "Hide WorkSpaces ▲" : "Show WorkSpaces ▼"}
          </button>
          <button onClick={() => setShowModal(true)}>+ Create Workspace</button>
        </div>

        {showModal && (
          <WorkspaceModal user={user} onClose={handleClose} onSubmit={handleSubmit} />
        )}
        {showProjectModal && (
          <AddProjectModal
            onClose={() => setShowProjectModal(false)}
            onSubmit={handleProjectSubmit}
            defaultData={{ assignedUserIds: [] }}
          />
        )}

        <AnimatePresence>
          {showWorkspaces && (
            <motion.ul
              className={styles.userList}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {workspaces.map((ws) => (
                <li key={ws.id} className={`${styles.userCard} ${styles.workspaceCard}`}>
                  <div className={styles.userDetails}>
                    <strong>{ws.name}</strong>
                    <p>{ws.description}</p>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => openProjectModal(ws.id)}>+ Create Project</button>
                    <button
                      onClick={() => confirmDeleteWorkspace(ws)}
                      className={styles.deleteButton}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))}
            </motion.ul>

          )}
        </AnimatePresence>
          
      </section>

      
      <section className={styles.section}>
        <h2>Manage Projects & Tasks</h2>
        <div className={styles.userHeader}>
          <button onClick={() => setShowProjectsSection((prev) => !prev)}>
            {showProjectsSection ? "Hide Projects ▲" : "Show Projects ▼"}
          </button>
        </div>

        <AnimatePresence>
          {showProjectsSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {workspaces.map((ws) => (
                <div key={ws.id} className={styles.workspaceWrapper}>
                  <ul>
                    <h3>{ws.name}</h3>
                    {projects
                      .filter((p) => p.workspaceId === ws.id)
                      .map((p) => {
                        const isOpen = expandedProjects[p.id];
                        return (
                          <li key={p.id} className={styles.projectItem}>
                            <div className={styles.projectHeader}>

                              <div>

                                <p className={styles.projectName}>📁 <strong>{p.name}</strong></p>
                                <p className={styles.projectDescription}>{p.description}</p>
                                <p className={`${styles.statusTag} ${styles[p.status.toLowerCase()]}`}>
                                  {p.status}
                                </p>
                              </div>

                              <div className={styles.projectItemButtons}>
                                
                              <button  onClick={() => toggleProjectVisibility(p.id)}>
                                {isOpen ? "Hide Tasks" : "Show Tasks"}
                              </button>
                              <button  onClick={() => openAddTaskModal(p.id)}>+ Add Task</button>
                                <button onClick={() => confirmDeleteProject(p)}>🗑️ Delete</button>
                              </div>
                                
                            </div>
                            
                              

                            <AnimatePresence>
                              {isOpen && (
                                <motion.ul
                                  className={styles.taskInProject}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.4 }}
                                >
                                  {tasks
                                    .filter((t) => t.projectId === p.id)
                                    .map((t) => (
                                      <li key={t.id}>
                                        <div className={styles.taskItem}>
                                          <div>
                                            <p className={styles.taskTitle}>📝 <strong>{t.title}</strong></p>
                                            <p className={styles.taskTitle}><strong>{t.description}</strong></p>

                                            <div className={styles.taskMeta}>
                                              <span className={`${styles.statusTag} ${styles[t.status.toLowerCase()]}`}>{t.status}</span>
                                              <span className={styles.priority}>{t.priority}</span>
                                            </div>
                                          </div>
                                          <div className={styles.taskItems}>
                                            <button onClick={() => openEditTaskModal(t)}>Edit</button>
                                            <button onClick={() => confirmDeleteTask(t)}>Delete🗑️</button>

                                          </div>
                                        </div>

                                      </li>
                                    ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      
      <section className={styles.section}>
        <h2>Manage Users</h2>
        <button onClick={() => setShowUsers((prev) => !prev)}>
          {showUsers ? "Hide Users ▲" : "Show Users ▼"}
        </button>
        {deletingUser && <TextSpinner />}
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

                

                </li>
              )
              
            
            ))}
            </motion.ul>
            
          )}
        </AnimatePresence>
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
      {showDeleteGroupModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 style={{ color: "red", marginBottom: "1rem" }}>⚠️ Confirm Group Deletion</h2>
            <p>
              This will <strong>permanently delete</strong> your group, all users, workspaces, projects, and tasks.
              <br /><br />
              <span style={{ color: "red", fontWeight: "bold" }}>This action cannot be undone.</span>
            </p>

            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#555" }}>
              To confirm, type <strong>"DELETE"</strong> below:
            </p>

            <input
              type="text"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />

            <div className={styles.modalButtons}>
              <button onClick={() => setShowDeleteGroupModal(false)} disabled={deletingGroup}>
                Cancel
              </button>

              <button
                className={`${styles.deleteAccount}`}
                onClick={handleGroupDelete}
                disabled={confirmDeleteText !== "DELETE" || deletingGroup}
              >
                {deletingGroup ? <TextSpinner /> : "Yes, Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button className={styles.deleteAccount} onClick={() => setShowDeleteGroupModal(true)}>
        Delete Account
      </button>


   
   
    </div>
  );
}

export default Admin;