import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ""}>
        Home
      </NavLink>
      <NavLink to="/tasks" className={({ isActive }) => isActive ? styles.active : ""}>
        Tasks
      </NavLink>
      <NavLink to="/workspaces" className={({ isActive }) => isActive ? styles.active : ""}>
        Workspaces
      </NavLink>
      <NavLink to="/user-profile" className={({ isActive }) => isActive ? styles.active : ""}>
        Profile
      </NavLink>
    </nav>
  );
}

export default Navbar;
