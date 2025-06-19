import { Outlet, useParams, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import styles from "./WorkspaceLayout.module.css";
import AddProjectModal from "../AddProjectModal/AddProjectModal";

function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`http://localhost:3001/workspaces/${workspaceId}`);
        const data = await res.json();
        setWorkspace(data);
      } catch (err) {
        console.error("Failed to fetch workspace:", err);
      }
    };
  
    fetchWorkspace();
  }, [workspaceId]);
  

  const showAddProjectModal = location.pathname.endsWith("/projects/new");

  const handleAddProject = async (projectData) => {
    try {
      const newProject = {
        ...projectData,
        workspaceId,
        createdBy: user?.id || "Unknown",
        createdAt: new Date().toISOString().split("T")[0]
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

 
  
  const isOnProjectDetail = location.pathname.match(
    new RegExp(`^/workspaces/${workspaceId}/projects/[^/]+$`)
  );

 

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Workspace: {workspace ? workspace.name : "Loading..."}</h2>

        <nav className={styles.nav}>
          {!isOnProjectDetail && (
            <>
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
                  const isActive =
                    path.startsWith(base) &&
                    !path.endsWith("/new") &&
                    !path.match(/\/projects\/[^/]+$/);
                  return isActive
                    ? `${styles.link} ${styles.active}`
                    : styles.link;
                }}
              >
                View All Projects
              </NavLink>

             {(user.role=="supervisor")&&( <NavLink
                to={`/workspaces/${workspaceId}/projects/new`}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                Add New Project
              </NavLink>)}
            </>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />

        {showAddProjectModal && workspace && (
          <AddProjectModal
            onClose={() => navigate(-1)}
            onSubmit={handleAddProject}
          />
        )}

     
      </main>
    </div>
  );
}

export default WorkspaceLayout;
