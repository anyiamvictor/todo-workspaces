import React from "react";
import styles from "./TextSpinner.module.css";

const TextSpinner = () => {
  return (
    <div className={styles.overlay}>
      <img src="/logo-favicon.png" alt="Loading Logo" className={styles.flippingLogo} />
    </div>
  );
};

export default TextSpinner;
