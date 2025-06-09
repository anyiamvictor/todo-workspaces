import { Outlet, useParams, Link } from "react-router-dom";
import styles from "./WorkspaceLayout.module.css";

function WorkspaceLayout() {
  const { workspaceId } = useParams();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Workspace: {workspaceId}</h2>
        <nav className={styles.nav}>
          <Link to={`/workspaces/${workspaceId}`}>Overview</Link>
          <Link to={`/workspaces/${workspaceId}/projects`}>View All Projects</Link>
          <Link to={`/workspaces/${workspaceId}/projects/new`}>Add New Project</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default WorkspaceLayout;
