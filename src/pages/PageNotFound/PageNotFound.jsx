import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PageNotFound.module.css";

function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.subtitle}>Page Not Found</h2>
        <p className={styles.message}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className={styles.actions}>
          <button onClick={() => navigate("/")} className={styles.btn}>
            Go to Home
          </button>
          <button onClick={() => navigate("/auth")} className={styles.btnAlt}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
