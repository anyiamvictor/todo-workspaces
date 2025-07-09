import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../SideBar/SideBar";
import Footer from "../Footer/Footer";
import styles from "./RootLayout.module.css";

function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  return (
<>
      <div className={styles.hamSection}>
      {/* Hamburger */}
   <button
    className={`${styles.sidebarToggle} ${sidebarOpen ? styles.open : ""}`}
    onClick={toggleSidebar}
    aria-label="Toggle sidebar"
  >
 
    <div className={styles.bar}></div>
    <div className={styles.bar}></div>
    <div className={styles.bar}></div>
  </button>
    </div >
      
      
    <div className={styles.rootContainer}>
  

      <div className={styles.rootLayout}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <SideBar closeSidebar={closeSidebar} />
        </aside>

        <main className={styles.pageContent} onClick={closeSidebar}>
          <Outlet />
        </main>
      </div>

      <div className={styles.footerContainer}>
        <Footer />
      </div>
    </div>
 </> );
}

export default RootLayout;
