import { Outlet } from "react-router-dom";
// import Navbar from "../NavBar/NavBar";
import Footer from "../Footer/Footer"; 
import SideBar from "../SideBar/SideBar";
import styles from './RootLayout.module.css';


function RootLayout() {
  return (
    <div className={styles.rootContainer}>

      <div className={styles.rootLayout}>
        <aside className={styles.sidebar}>
          <SideBar />
        </aside>
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>

      <div className={styles.footerContainer}>
      <Footer />
      </div>

    </div>
  );
}

  export default RootLayout;