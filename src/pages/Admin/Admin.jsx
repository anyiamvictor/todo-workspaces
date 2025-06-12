// src/pages/Admin/AdminPage.jsx
import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import styles from "./Admin.module.css";


function Admin() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`http://localhost:3001/groups/${groupId}`);
        const data = await res.json();

        if (!res.ok || !data || data.adminId !== user.id) {
          setError("Unauthorized or group not found.");
        } else {
          setGroup(data);
        }
      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, user.id]);

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return <p>Loading admin dashboard...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminHeader}>Admin Panel for {group?.name}</h1>
      <p className={styles.adminWelcome}>Welcome, {user.name}! You are the admin of this group.</p>
  
      <ul className={styles.adminActions}>
        <li>View all workspaces</li>
        <li>Manage users</li>
        <li>Assign roles</li>
        <li>View reports</li>
      </ul>
    </div>
  );
  
}

export default Admin;
