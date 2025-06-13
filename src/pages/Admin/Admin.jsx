import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import styles from "./Admin.module.css";

function Admin() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newInviteCode, setNewInviteCode] = useState("");
const [updatingInviteCode, setUpdatingInviteCode] = useState(false);


  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupRes = await fetch(`http://localhost:3001/groups/${groupId}`);
        const groupData = await groupRes.json();

        if (!groupRes.ok || groupData.adminId !== user.id) {
          setError("Unauthorized or group not found.");
          return;
        }

        // Fetch group-related data
        const [wsRes, usersRes] = await Promise.all([
          fetch(`http://localhost:3001/workspaces?groupId=${groupId}`),
          fetch(`http://localhost:3001/users?groupId=${groupId}`)
        ]);

        const wsData = await wsRes.json();
        const userData = await usersRes.json();

        setGroup(groupData);
        setWorkspaces(wsData);
        setUsers(userData);
        setNewInviteCode(groupData.inviteCode || "");


        // Now fetch projects and tasks
        const workspaceIds = wsData.map((ws) => ws.id);

        const projRes = await fetch(`http://localhost:3001/projects`);
        const projData = await projRes.json();
        const groupProjects = projData.filter((p) => workspaceIds.includes(p.workspaceId));
        setProjects(groupProjects);

        const projIds = groupProjects.map((p) => p.id);
        const taskRes = await fetch(`http://localhost:3001/tasks`);
        const taskData = await taskRes.json();
        const groupTasks = taskData.filter((t) => projIds.includes(t.projectId));
        setTasks(groupTasks);
      } catch (err) {
        console.error(err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, user.id]);

  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (loading) return <p>Loading admin dashboard...</p>;
  if (error) return <p>{error}</p>;

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === "supervisor" ? "member" : "supervisor";
    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const deleteUser = async (userId) => {
    await fetch(`http://localhost:3001/users/${userId}`, {
      method: "DELETE",
    });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateInviteCode = async () => {
    if (!newInviteCode.trim()) return;
  
    setUpdatingInviteCode(true);
    try {
      const res = await fetch(`http://localhost:3001/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: newInviteCode.trim() }),
      });
  
      if (res.ok) {
        setGroup((prev) => ({ ...prev, inviteCode: newInviteCode.trim() }));
      } else {
        alert("Failed to update invite code.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the invite code.");
    } finally {
      setUpdatingInviteCode(false);
    }
  };
  

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminHeader}>Admin Panel for {group?.name}</h1>
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

      

      {/* Workspaces */}
      <section className={styles.section}>
        <h2>Workspaces</h2>
        <ul>
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <strong>{ws.name}</strong> - {ws.description}
              {/* Add edit/delete UI later */}
            </li>
          ))}
        </ul>
      </section>

      {/* Projects by workspace */}
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
                    <strong>📁 {p.name}</strong> – {p.description} [{p.status}]
                    <ul>
                      {tasks
                        .filter((t) => t.projectId === p.id)
                        .map((t) => (
                          <li key={t.id}>
                            📝 <strong>{t.title}</strong> – {t.status} – {t.priority}
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Users */}
      <section className={styles.section}>
        <h2>Manage Users</h2>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.name} ({u.email}) – {u.role} – {u.status}
              <button onClick={() => toggleUserStatus(u.id, u.status)}>
                {u.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => toggleUserRole(u.id, u.role)}>
                {u.role === "supervisor" ? "Unmake Supervisor" : "Make Supervisor"}
              </button>
              <button onClick={() => deleteUser(u.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Admin;
