// functions/deleteGroupCompletely.js
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const deleteGroupCompletely = onCall(async (request) => {
  const { auth } = request;
  if (!auth?.uid)
    throw new HttpsError("unauthenticated", "You must be logged in.");

  const db = getFirestore();
  const authAdmin = getAuth();

  const adminDoc = await db.doc(`users/${auth.uid}`).get();
  const adminData = adminDoc.data();

  if (!adminData || adminData.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only an admin can delete the group."
    );
  }

  const groupId = adminData.groupId;
  if (!groupId) throw new HttpsError("invalid-argument", "Missing groupId");

  // 1. Delete all users in that group
  const userSnaps = await db
    .collection("users")
    .where("groupId", "==", groupId)
    .get();
  const userDeletePromises = [];

  for (const doc of userSnaps.docs) {
    const uid = doc.id;
    userDeletePromises.push(doc.ref.delete()); // Firestore
    userDeletePromises.push(authAdmin.deleteUser(uid).catch(() => null)); // Auth (ignore if already deleted)
  }

  // 2. Delete workspaces
  const workspaceSnaps = await db
    .collection("workspaces")
    .where("groupId", "==", groupId)
    .get();
  const workspaceIds = workspaceSnaps.docs.map((doc) => doc.id);
  const workspaceDeletes = workspaceSnaps.docs.map((doc) => doc.ref.delete());

  // 3. Delete projects in those workspaces
  const projectSnaps = await db.collection("projects").get();
  const groupProjects = projectSnaps.docs.filter((doc) =>
    workspaceIds.includes(doc.data().workspaceId)
  );
  const projectIds = groupProjects.map((doc) => doc.id);
  const projectDeletes = groupProjects.map((doc) => doc.ref.delete());

  // 4. Delete tasks in those projects
  const taskSnaps = await db.collection("tasks").get();
  const groupTasks = taskSnaps.docs.filter((doc) =>
    projectIds.includes(doc.data().projectId)
  );
  const taskDeletes = groupTasks.map((doc) => doc.ref.delete());

  // 5. Delete group itself
  const groupDelete = db.collection("groups").doc(groupId).delete();

  await Promise.all([
    ...userDeletePromises,
    ...workspaceDeletes,
    ...projectDeletes,
    ...taskDeletes,
    groupDelete,
  ]);

  return { success: true, message: `Group ${groupId} and all data deleted.` };
});
