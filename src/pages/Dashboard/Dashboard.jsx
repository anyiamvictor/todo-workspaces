import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const {user,   logout } = useAuth();
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
        console.log("Fetched users:", users);
        console.log("Current user ID:", currentUserId);


        const currentUser = users.find((u) => String(u.id) === String(currentUserId));
        if (!currentUser) throw new Error('User not found');
        setCurrentUser(currentUser);
        

        const userWorkspaces = allWorkspaces.filter(
          (w) => w.ownerId === currentUserId || w.memberIds.includes(currentUserId)
        );

        setWorkspaces(userWorkspaces);

        const userProjects = allProjects.filter(
          (p) => Array.isArray(p.assignedUserIds) && p.assignedUserIds.includes(currentUserId)
        );
        
        setProjects(userProjects);

        const userTasks = allTasks.filter(
          (t) => Array.isArray(t.assignedUserIds) && t.assignedUserIds.includes(currentUserId)
        );
        
        setTasks(userTasks);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };

    fetchData();
  }, [currentUserId]);

  const getStatusCount = (status) =>
    tasks.filter((t) => t.status === status).length;

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
        
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

  
      <div className={styles.cardGroup}>
        <div className={styles.card}>
          <h2>Workspaces</h2>
          <ul>
            {workspaces.map((w) => (
              <li key={w.id}>{w.name}</li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Projects</h2>
          <ul>
            {projects.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Task Summary</h2>
          <ul>
            <li>Pending: {getStatusCount('pending')}</li>
            <li>In Progress: {getStatusCount('in progress')}</li>
            <li>Completed: {getStatusCount('completed')}</li>
            <li>Approved: {getStatusCount('approved')}</li>
            <li>Rejected: {getStatusCount('rejected')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
