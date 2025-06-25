import { NavLink, Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
// import logo from "../../assets/logo-light-transparent.png";
import logo from "../../assets/logo-transparent.png";


function SideBar({ closeSidebar }) {
  return (
    <div className={styles.sidebarInner}>
      <Link to="/" className={styles.logo} onClick={closeSidebar}>
        <img src={logo} alt="Logo" />
      </Link>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`} onClick={closeSidebar}>
          Dashboard
        </NavLink>
        <NavLink to="/workspaces" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`} onClick={closeSidebar}>
          Workspaces
        </NavLink>
        <NavLink to="/userprofile" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`} onClick={closeSidebar}>
          My Profile
        </NavLink>
      </nav>
    </div>
  );
}

export default SideBar;
