import { Outlet, useParams, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./WorkspaceLayout.module.css";
import AddProjectModal from "../AddProjectModal/AddProjectModal";

function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, workspaceRes] = await Promise.all([
          fetch("http://localhost:3001/users"),
          fetch(`http://localhost:3001/workspaces/${workspaceId}`)
        ]);

        const usersData = await usersRes.json();
        const workspaceData = await workspaceRes.json();

        setUsers(usersData);
        setWorkspace(workspaceData);
      } catch (err) {
        console.error("Failed to fetch workspace or users:", err);
      }
    };

    fetchData();
  }, [workspaceId]);

  const showAddProjectModal = location.pathname.endsWith("/projects/new");

  const handleAddProject = async (projectData) => {
    try {
      const newProject = {
        ...projectData,
        workspaceId,
      };

      const response = await fetch("http://localhost:3001/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) throw new Error("Failed to create project");

      navigate(`/workspaces/${workspaceId}/projects`);
    } catch (error) {
      alert("Error adding project: " + error.message);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Workspace: {workspaceId}</h2>
        <nav className={styles.nav}>
          <NavLink
            to={`/workspaces/${workspaceId}`}
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Overview
          </NavLink>

          <NavLink
            to={`/workspaces/${workspaceId}/projects`}
            className={() => {
              const path = location.pathname;
              const base = `/workspaces/${workspaceId}/projects`;
              const isActive = path.startsWith(base) && !path.endsWith("/new");
              return isActive
                ? `${styles.link} ${styles.active}`
                : styles.link;
            }}
          >
            View All Projects
          </NavLink>

          <NavLink
            to={`/workspaces/${workspaceId}/projects/new`}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Add New Project
          </NavLink>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
        {showAddProjectModal && workspace && (
          <AddProjectModal
            onClose={() => navigate(-1)}
            onSubmit={handleAddProject}
            defaultData={{ assignedUserIds: [] }}
          />
        )}
      </main>
    </div>
  );
}

export default WorkspaceLayout;
