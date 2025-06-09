import { Outlet, useParams, NavLink, useLocation } from "react-router-dom";
import styles from "./WorkspaceLayout.module.css";

function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const location = useLocation();

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
              const projectsBase = `/workspaces/${workspaceId}/projects`;
              const isActive =
                path.startsWith(projectsBase) && !path.endsWith("/new");
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
      </main>
    </div>
  );
}

export default WorkspaceLayout;
