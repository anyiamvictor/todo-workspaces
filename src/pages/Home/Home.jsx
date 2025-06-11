import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1>Welcome to TaskBoard</h1>
        <p>Collaborate with your team. Manage workspaces, projects, and tasks efficiently.</p>
      </header>

      <section className={styles.authSection}>
        <h2>Get Started</h2>
        <div className={styles.authButtons}>
          <button onClick={() => navigate("/auth?mode=auth")}>Login/SignUp</button>
        </div>
      </section>
    </div>
  );
}

export default Home;
