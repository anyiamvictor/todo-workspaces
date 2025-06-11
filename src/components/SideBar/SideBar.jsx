import { NavLink, Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "../../assets/logo-light-transparent.png"; // Adjust the path as necessary

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.logo}>
        <img src={logo} alt="Logo" />
      </Link>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.active : ""} end>
          Dashboard
        </NavLink>
        <NavLink to="/workspaces" className={({ isActive }) => isActive ? styles.active : ""}>
          Workspaces
        </NavLink>
        {/* <NavLink to="/tasks" className={({ isActive }) => isActive ? styles.active : ""}>
          Tasks
        </NavLink> */}
        <NavLink to="/userprofile" className={({ isActive }) => isActive ? styles.active : ""}>
         My Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
