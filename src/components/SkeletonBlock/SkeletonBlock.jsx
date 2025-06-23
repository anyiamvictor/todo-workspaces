import React from "react";
import styles from "./SkeletonBlock.module.css";

function SkeletonBlock({ width = "100%", height = "16px", radius = "4px", animated = true, style = {} }) {
  return (
    <div
      className={animated ? styles.skeletonAnimated : styles.skeletonStatic}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export default SkeletonBlock;



// // For a user avatar and name
// <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//   <SkeletonBlock width="40px" height="40px" radius="50%" />
//   <SkeletonBlock width="150px" height="16px" />
// </div>

// // For a card
// <div style={{ padding: "1rem" }}>
//   <SkeletonBlock width="60%" height="20px" />
//   <SkeletonBlock width="100%" height="12px" style={{ marginTop: "10px" }} />
//   <SkeletonBlock width="80%" height="12px" style={{ marginTop: "8px" }} />
// </div>