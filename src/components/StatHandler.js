import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../components/firebaseConfig"; // adjust path if needed

export const updateUserStat = async (uid, field, delta = 1) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const current = userSnap.data()[field] || 0;
  await updateDoc(userRef, {
    [field]: Math.max(0, current + delta),
  });
};
