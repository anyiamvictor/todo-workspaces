import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContextFirebase';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,doc,updateDoc
} from 'firebase/firestore';
import { db } from '../../components/firebaseConfig';
import styles from './Dashboard.module.css';



const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showWorkspaceDetails, setShowWorkspaceDetails] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentUserUid = user?.uid;

  useEffect(() => {
    if (!currentUserUid) return;

    const fetchData = async () => {
      try {
        // Workspaces where user is owner or member
        const workspaceSnap = await getDocs(collection(db, "workspaces"));
        const allWorkspaces = workspaceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userWorkspaces = allWorkspaces.filter(
          w => w.ownerId === currentUserUid || w.memberIds?.includes(currentUserUid)
        );
        setWorkspaces(userWorkspaces);

        // Projects created by user
        const projectQ = query(
          collection(db, "projects"),
          where("createdBy", "==", currentUserUid)
        );
        const projectSnap = await getDocs(projectQ);
        const userProjects = projectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(userProjects);

        // Tasks assigned to user
        const taskSnap = await getDocs(collection(db, "tasks"));
        const allTasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userTasks = allTasks.filter(t => {
          return Array.isArray(t.assignedTo)
            ? t.assignedTo.includes(currentUserUid)
            : t.assignedTo === currentUserUid;
        });
        setTasks(userTasks);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [currentUserUid]);

  useEffect(() => {
    if (!currentUserUid) return;

    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUserUid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notes);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
  }, [currentUserUid]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.seen);
    for (const note of unread) {
      const ref = doc(db, "notifications", note.id);
      await updateDoc(ref, { seen: true });
    }
  };

  const toggleNotifications = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) await markAllAsRead();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className={styles.container}>
    <div className={styles.headerRow}>
  <div className={styles.nameimg}>
    <h1 className={styles.title}>Welcome {user?.name}</h1>
    <div className={styles.avatar}>
      <img src={user?.avatarUrl || '/default-avatar.png'} alt="Avatar" />
    </div>
    <div className={styles.rightControls}>
      <button onClick={toggleNotifications} className={`${styles.bellButton} ${notifications.some(n => !n.seen) ? styles.hasUnread : ''}`}>
        🔔
        {notifications.some(n => !n.seen) && (
          <span className={styles.notificationDot} />
        )}
      </button>
      <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
    </div>
  </div>
</div>


      {showNotifications && (
        <div className={`${styles.notificationDropdown} ${styles.show}`}>
          <h4>Notifications</h4>
          <ul>
            {notifications.length > 0 ? (
              notifications.map((note) => (
                <li key={note.id}>
                  {note.message}
                  {!note.seen && <span className={styles.unreadDot} />}
                </li>
              ))
            ) : (
              <li>No new notifications</li>
            )}
          </ul>
        </div>
      )}

      <div className={styles.cardGroup}>
        {/* Workspaces Card */}
        <div className={styles.card}>
          <h2>Your Workspaces</h2>
          <ul>
            {workspaces.map((w) => (
              <li key={w.id}>{w.name}</li>
            ))}
          </ul>
          <button
            className={styles.detailButton}
            onClick={() => setShowWorkspaceDetails(!showWorkspaceDetails)}
          >
            {showWorkspaceDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showWorkspaceDetails && (
            <div className={styles.detailSection}>
              {user.role === "supervisor" && (
                <>
                  <h4>Owned Workspaces</h4>
                  <ul>
                    {workspaces
                      .filter((w) => w.ownerId === currentUserUid)
                      .map((w) => (
                        <li key={w.id}>{w.name}</li>
                      ))}
                  </ul>
                </>
              )}
              <h4>Member Workspaces</h4>
              <ul>
                {workspaces
                  .filter((w) => w.ownerId !== currentUserUid)
                  .map((w) => (
                    <li key={w.id}>{w.name}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Projects Card */}
        {user.role === "supervisor" && (
          <div className={styles.card}>
            <h2>Your Projects</h2>
            <ul>
              {projects.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            <button
              className={styles.detailButton}
              onClick={() => setShowProjectDetails(!showProjectDetails)}
            >
              {showProjectDetails ? 'Hide Details' : 'Show Details'}
            </button>
            {showProjectDetails && (
              <div className={styles.detailSection}>
                <h4>Owned Projects</h4>
                <ul>
                  {projects.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Task Summary */}
        <div className={styles.card}>
          <h2>Quick Task Summary</h2>
          <ul>
            <li>Pending: {user?.pendingCount || 0}</li>
            <li>Approved: {user?.approvedCount || 0}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
