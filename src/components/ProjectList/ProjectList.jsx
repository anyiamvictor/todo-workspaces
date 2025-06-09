import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
    <div>
      <h3>Projects: </h3>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link to={`/workspaces/${workspaceId}/projects/${project.id}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
      </div>
      
      
  );
}

export default ProjectList;
