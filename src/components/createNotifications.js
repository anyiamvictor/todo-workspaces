import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../components/firebaseConfig"; // adjust the path as needed

export async function createNotifications({ userId, message }) {
  try {
    // ✅ Check if user exists by UID
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`Notification not created: User ${userId} not found.`);
      return;
    }

    // ✅ Create the notification
    await addDoc(collection(db, "notifications"), {
      userId, // should match uid
      message,
      seen: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
