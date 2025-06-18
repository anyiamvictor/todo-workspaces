import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showWorkspaceDetails, setShowWorkspaceDetails] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentUserId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, workspacesRes, projectsRes, tasksRes] = await Promise.all([
          fetch('http://localhost:3001/users'),
          fetch('http://localhost:3001/workspaces'),
          fetch('http://localhost:3001/projects'),
          fetch('http://localhost:3001/tasks'),
        ]);

        const users = await usersRes.json();
        const allWorkspaces = await workspacesRes.json();
        const allProjects = await projectsRes.json();
        const allTasks = await tasksRes.json();

        const currentUser = users.find((u) => String(u.id) === String(currentUserId));
        if (!currentUser) throw new Error('User not found');

        setCurrentUser(currentUser);

        const userWorkspaces = allWorkspaces.filter(
          (w) => w.ownerId === currentUserId || w.memberIds.includes(currentUserId)
        );
        setWorkspaces(userWorkspaces);

        const userProjects = allProjects.filter((p) => p.createdBy === currentUserId);
        setProjects(userProjects);

        const userTasks = allTasks.filter((t) => {
          if (Array.isArray(t.assignedTo)) {
            return t.assignedTo.includes(currentUserId);
          }
          return t.assignedTo === currentUserId;
        });
        setTasks(userTasks);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [currentUserId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/notifications?userId=${currentUserId}&_sort=createdAt&_order=desc`
        );
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (currentUserId) fetchNotifications();
  }, [currentUserId]);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.seen);
    for (const note of unread) {
      await fetch(`http://localhost:3001/notifications/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seen: true }),
      });
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
          <h1 className={styles.title}>Welcome {currentUser?.name}</h1>
          <div className={styles.avatar}>
            <img
              src={currentUser?.avatarUrl || '/default-avatar.png'}
              alt="currentUser Avatar"
            />
          </div>
        </div>

        <div className={styles.rightControls}>
          <button onClick={toggleNotifications} className={styles.bellButton}>
            🔔
            {notifications.some((n) => !n.seen) && (
              <span className={styles.notificationDot} />
            )}
          </button>

          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {showNotifications && (
        <div className={styles.notificationsDropdown}>
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
              <h4>Owned Workspaces</h4>
              <ul>
                {workspaces
                  .filter((w) => String(w.ownerId) === String(currentUserId))
                  .map((w) => (
                    <li key={w.id}>{w.name}</li>
                  ))}
              </ul>

              <h4>Member Workspaces</h4>
              <ul>
                {workspaces
                  .filter((w) => String(w.ownerId) !== String(currentUserId))
                  .map((w) => (
                    <li key={w.id}>{w.name}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Projects Card */}
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
                {projects
                  .filter((p) => String(p.createdBy) === String(currentUserId))
                  .map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Task Summary */}
        <div className={styles.card}>
          <h2>Quick Task Summary</h2>
          <ul>
            <li>Pending: {currentUser?.pendingCount || 0}</li>
            <li>Approved: {currentUser?.approvedCount || 0}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
