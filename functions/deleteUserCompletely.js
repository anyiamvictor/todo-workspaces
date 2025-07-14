import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Deletes a user from both Firestore and Firebase Authentication.
 * Only callable by an authenticated user (admin check is optional but can be added).
 */
export const deleteUserCompletely = onCall(async (request) => {
  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "UID is required.");
  }

  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Delete from Firestore
    await db.collection("users").doc(uid).delete();

    // 2. Delete from Firebase Auth
    await auth.deleteUser(uid);

    return {
      success: true,
      message: `User ${uid} deleted successfully.`,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpsError("internal", "Failed to delete user.");
  }
});
