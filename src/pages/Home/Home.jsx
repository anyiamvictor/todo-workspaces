import { useNavigate, Link } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1>
          Welcome to Todo<span style={{ color: "red" }}>Workspaces</span>
        </h1>
        <p>
          Collaborate with your team. Manage workspaces, projects, and tasks efficiently.
        </p>
      </header>

      <section className={styles.authSection}>
        <h2>Get Started</h2>

        <div className={styles.authBlocks}>
          {/* Existing Users Block */}
          <div className={styles.authBox}>
            <h3>Already have an account?</h3>
            <button   onClick={() => navigate("/auth?mode=auth")}>
              Login / Sign Up
            </button>
          </div>

          {/* New Company Registration Block */}
          <div className={styles.authBox}>
            <h3>New company or team?</h3>
            <div className={styles.typewriterText}>
            <span>Register&nbsp;</span>
            <Typewriter
                words={["  your Company", "your Team", "your Workspace", "your Project"]}
                loop={true}
                cursor
                cursorStyle="✍🏼"
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1500}
              />
            </div>
            <Link to="/register" className={styles.registerButton}>
              <span>Register&nbsp;</span>
              
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
