import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./ProjectList.module.css";


function ProjectList() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:3001/projects?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [workspaceId]);

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p>Error: {error}</p>;
  if (projects.length === 0) return <p>No projects found for this workspace.</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Projects:</h3>
  
      {loading && <p className={styles.statusMessage}>Loading projects...</p>}
      {error && <p className={styles.statusMessage}>Error: {error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className={styles.statusMessage}>No projects found for this workspace.</p>
      )}
  
      <ul className={styles.projectList}>
        {projects.map((project) => (
          <li key={project.id} className={styles.projectItem}>
            <Link
              to={`/workspaces/${workspaceId}/projects/${project.id}`}
              className={styles.projectLink}>
              {project.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  
}

export default ProjectList;
