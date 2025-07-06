import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../components/firebaseConfig";
import styles from "./MemberDetailsPerformance.module.css";
import TextSpinner from "../../components/TextSpinner/TextSpinner";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MemberDetailsPerformance({ userId, onClose }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const ref = doc(db, "users", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching user performance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [userId]);

  if (!userId) return null;

  // Logic to analyze performance
  const performanceSummary = (() => {
    const assigned = userData?.totalAssignedTask || 0;
    const completed = userData?.completedCount || 0;
    const rejected = userData?.rejectedCount || 0;
    const approved = userData?.approvedCount || 0;
  
    const firstAssignedAt = userData?.firstAssignedAt?.toDate?.() || null;
  
    if (assigned === 0) {
      return {
        level: "neutral",
        message: "ℹ️ This user is yet to be assigned any tasks.",
      };
    }
  
    const now = new Date();
    const hasActivity = completed > 0 || approved > 0 || rejected > 0;
  
    if (!hasActivity && firstAssignedAt) {
      const timeElapsedMs = now - firstAssignedAt;
      const twoHoursMs = 2 * 60 * 60 * 1000;
  
      const dateStr = firstAssignedAt.toLocaleDateString();
      const timeStr = firstAssignedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
      if (timeElapsedMs <= twoHoursMs) {
        return {
          level: "neutral",
          message: `⏳ User was just assigned tasks at ${timeStr} on ${dateStr}.`,
        };
      } else {
        return {
          level: "concerning",
          message: `⚠️ User was assigned tasks over 2 hours ago (${timeStr} on ${dateStr}) and has not acted yet.`,
        };
      }
    }
  
    const completionRate = completed / assigned;
    const approvalRate = approved + rejected > 0 ? approved / (approved + rejected) : 0;
  
    if (completionRate >= 0.7 && approvalRate >= 0.8) {
      return {
        level: "good",
        message: "✅ This user is performing well.",
      };
    } else if (completionRate < 0.4 || approvalRate < 0.5) {
      return {
        level: "poor",
        message: "❌ This user needs significant improvement.",
      };
    } else {
      return {
        level: "average",
        message: "🟡 This user is doing okay, but there's room to improve.",
      };
    }
  })();
  
  
  
  

  // Chart Data
  const chartData = {
    labels: ["Approved", "Rejected", "Pending", "Completed"],
    datasets: [
      {
        label: "Performance Breakdown",
        data: [
          userData?.approvedCount || 0,
          userData?.rejectedCount || 0,
          userData?.pendingCount || 0,
          userData?.completedCount || 0,
        ],
        backgroundColor: ["#28a745", "#dc3545", "#fd7e14", "#007bff"],
        borderWidth: 1,
      },
    ],
  };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>User Performance</h2>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                {loading ? (
                    <TextSpinner />
                ) : userData ? (
                    <div className={styles.contentWrapper}>
                        <div className={styles.statsGrid}>
                            <p><strong>UID:</strong> {userData.uid}</p>
                            <p><strong>Bio:</strong> {userData.bio || "N/A"}</p>
                            <p><strong>Phone:</strong> {userData.phoneNumber || "N/A"}</p>
                            <p><strong>Approved:</strong> {userData.approvedCount || 0}</p>
                            <p><strong>Rejected:</strong> {userData.rejectedCount || 0}</p>
                            <p><strong>Pending:</strong> {userData.pendingCount || 0}</p>
                            <p><strong>Completed Tasks:</strong> {userData.completedCount || 0}</p>
                            <p><strong>Assigned Tasks:</strong> {userData.totalAssignedTask || 0}</p>
                            <p><strong>Completed Projects:</strong> {userData.totalProjectCompleted || 0}</p>
                            <p><strong>Workspaces:</strong> {userData.workSpaceCount || 0}</p>

                            <p className={`${styles.performanceSummary} ${styles[performanceSummary.level]}`}>
                                {performanceSummary.message}
                            </p>

                        </div>

                        <div className={styles.chartContainer}>
                            <Doughnut data={chartData} />
                        </div>
                    </div>
                ) : (
                    <p>User data not found.</p>
                )}
            </div>
        </div>
    );
}
