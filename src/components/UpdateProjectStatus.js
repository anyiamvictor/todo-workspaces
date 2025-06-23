import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig"; // adjust path as needed

export async function updateProjectStatus(projectId) {
  try {
    // Fetch tasks where projectId == given projectId
    const tasksQuery = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );
    const taskSnap = await getDocs(tasksQuery);
    const tasks = taskSnap.docs.map((doc) => doc.data());

    let newStatus = "active";

    if (tasks.length === 0) {
      newStatus = "pending";
    } else {
      const allApproved = tasks.every((t) => t.status === "approved");
      const anyCompleted = tasks.some((t) => t.status === "completed");

      if (allApproved) newStatus = "completed";
      else if (anyCompleted) newStatus = "active";
    }

    // Update project status
    await updateDoc(doc(db, "projects", projectId), {
      status: newStatus,
    });
  } catch (err) {
    console.error("Error updating project status:", err);
  }
}
