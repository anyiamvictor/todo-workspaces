import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import logo from "../../assets/logo-light-transparent.png"; // Adjust the path as necessary

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <span className={styles.logo}>
        <img src={logo} alt="Logo" />
      </span>

      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ""} end>
          Home
        </NavLink>
        <NavLink to="/workspaces" className={({ isActive }) => isActive ? styles.active : ""}>
          Workspaces
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => isActive ? styles.active : ""}>
          Tasks
        </NavLink>
        
        <NavLink to="/user-profile" className={({ isActive }) => isActive ? styles.active : ""}>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
