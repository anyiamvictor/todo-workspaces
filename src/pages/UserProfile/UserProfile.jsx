import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContextFirebase';
import styles from './UserProfile.module.css';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip,ResponsiveContainer } from 'recharts';
import { db } from '../../components/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';

const COLORS = ['#00C49F', '#FF8042', '#FF3B3F', '#0088FE'];

const UserProfile = () => {
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [groupName, setGroupName] = useState(user?.groupName || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksSnap, workspacesSnap, groupsSnap] = await Promise.all([
          getDocs(query(collection(db, 'tasks'), where('assignedTo', '==', user.uid))),
          getDocs(collection(db, 'workspaces')),
          getDocs(collection(db, 'groups')),
        ]);

        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userTasks = tasks
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
        setRecentTasks(userTasks);

        const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userGroup = groups.find(g => g.id === user.groupId);
        if (userGroup  && userGroup.name) setGroupName(userGroup.name);

        const allWorkspaces = workspacesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userWorkspaces = allWorkspaces.filter(
          (w) => w.ownerId === user.uid || (w.memberIds || []).includes(user.uid)
        );
        setWorkspaces(userWorkspaces);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      }
    };

    fetchData();
  }, [user.uid, user.groupId]);

  const chartData = [
    { name: 'Completed', value: user.completedCount || 0 },
    { name: 'Approved', value: user.approvedCount || 0 },
    { name: 'Rejected', value: user.rejectedCount || 0 },
    { name: 'Pending', value: user.pendingCount || 0 },
  ];

  const completionRate = user.totalAssignedTask
    ? ((user.approvedCount / user.totalAssignedTask) * 100).toFixed(1)
    : '0.0';

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { bio });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update bio:', err);
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.profileHeader}>
        <img
          src={user.avatarUrl || '/default-avatar.png'}
          alt="Avatar"
          className={styles.avatar}
        />
        <div>
          <h1>{user.name}</h1>
          <p className={styles.role}>{user.role} — {groupName}</p>
          <p>Last seen: {user.lastSeen || 'Just now'}</p>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing && (
  <EditProfileModal
    user={user}
    onClose={() => setIsEditing(false)}
    onUpdated={() => {
      // Optional: refresh data here
      setBio(user.bio); // or re-fetch
    }}
  />
)}

      <div className={styles.statsGrid}>
        {/* Task Overview Pie */}
        <motion.div className={styles.card} whileHover={{ scale: 1.05 }}>
          <h3>Task Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
          <PieChart width={200} height={200}>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Task Stats */}
        <motion.div className={styles.card} whileHover={{ scale: 1.05 }}>
          <h3>Statistics</h3>
          <ul>
            <li>Total Assigned: {user.totalAssignedTask || 0}</li>
            <li>Completed: {user.completedCount || 0}</li>
            <li>Approved: {user.approvedCount || 0}</li>
            <li>Rejected: {user.rejectedCount || 0}</li>
            <li>Pending: {user.pendingCount || 0}</li>
            <li>Completion Rate: {completionRate}%</li>
            <li>Projects Completed: {user.totalProjectsCompleted || 0}</li>
            <li>Workspaces: {user.workspaceCount || 0}</li>
          </ul>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className={styles.card} whileHover={{ scale: 1.05 }}>
          <h3>Recent Activity</h3>
          <ul>
            {recentTasks.length === 0 ? (
              <li>No recent activity.</li>
            ) : (
              recentTasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong> — {new Date(task.updatedAt?.toDate?.() || task.updatedAt).toLocaleDateString()}
                </li>
              ))
            )}

          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserProfile;