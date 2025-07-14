import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Callable function to assign roles to users.
 * Only an authenticated user with admin role can perform this.
 */
export const assignRole = onCall(async (request) => {
  const db = getFirestore();
  const { auth, data } = request;

  // 🔒 1. Ensure user is authenticated
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const { targetUid, newRole } = data;

  if (!targetUid || !newRole) {
    throw new HttpsError("invalid-argument", "Missing targetUid or newRole.");
  }

  // 🔍 2. Verify the calling user is an admin
  const adminSnap = await db.doc(`users/${auth.uid}`).get();
  const adminData = adminSnap.data();

  if (!adminData || adminData.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can assign roles.");
  }

  // ✅ 3. Validate role
  const validRoles = ["member", "supervisor"];
  if (!validRoles.includes(newRole)) {
    throw new HttpsError("invalid-argument", "Invalid role assignment.");
  }

  // ✏️ 4. Update target user's role
  try {
    await db.doc(`users/${targetUid}`).update({ role: newRole });

    return {
      success: true,
      message: `User ${targetUid} role updated to ${newRole}.`,
    };
  } catch (error) {
    console.error("Error updating role:", error);
    throw new HttpsError("internal", "Failed to update role.");
  }
});
