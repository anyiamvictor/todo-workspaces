import React, { useEffect, useState } from "react";
import styles from "./WorkspaceModal.module.css";
import MemberChecklistModal from "../MemberChecklistModal/MemberChecklistModal";
import { createNotifications } from "../createNotifications";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../../components/firebaseConfig";
import TextSpinner from "../TextSpinner/TextSpinner";
function WorkspaceModal({ user, onClose, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const q = query(collection(db, "users"), where("groupId", "==", user.groupId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((u) => u.status === "active")
          .sort((a, b) => a.name.localeCompare(b.name));
        setUsers(data);
      } catch (error) {
        setErrorUsers(error.message);
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [user.groupId]);

  const groupMembers = users;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const allMemberIds = [...new Set([user.uid, ...selectedMemberIds])];

    const newDocRef = doc(collection(db, "workspaces"));
    const newWorkspace = {
      id: newDocRef.id,
      name,
      description,
      createdAt: new Date().toISOString(),
      ownerId: user.uid,
      memberIds: allMemberIds,
      groupId: user.groupId,
    };

    try {
      // Save workspace
      await setDoc(newDocRef, newWorkspace);

      // Update workspace count
      await Promise.all(
        allMemberIds.map(async (uid) => {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) return;

          const userData = userSnap.data();
          const updatedCount = (userData.workspaceCount || 0) + 1;
          await updateDoc(userRef, { workspaceCount: updatedCount });
        })
      );

      // Notify selected members
      await Promise.all(
        selectedMemberIds.map((uid) =>
          createNotifications({
            userId: uid,
            message: `You've been added to a new workspace: "${name}"`,
          })
        )
      );

      onSubmit(newWorkspace); // Pass to parent
      onClose();
    } catch (err) {
      console.error("Error during workspace creation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUsers)return (
  <TextSpinner/>)
  if (errorUsers) return <p>Error loading users: {errorUsers}</p>;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3 className={styles.heading}>Add New Workspace</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Workspace Name:
            <input
              type="text"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <div className={styles.membersSection}>
            <button
              type="button"
              onClick={() => setShowMemberModal(true)}
              className={styles.selectMembersButton}
            >
              Select Members ({selectedMemberIds.length})
            </button>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <TextSpinner/> : "Create"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        {showMemberModal && (
          <MemberChecklistModal
            members={groupMembers}
            selected={selectedMemberIds}
            onClose={() => setShowMemberModal(false)}
            onChange={setSelectedMemberIds}
            ownerId={user.uid}
          />
        )}
      </div>
    </div>
  );
}

export default WorkspaceModal;
