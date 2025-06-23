import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./WorkspaceItem.module.css";
import MemberChecklistModal from "../../../components/MemberChecklistModal/MemberChecklistModal";
import { useAuth } from "../../../contexts/AuthContext/AuthContextFirebase";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
 
} from "firebase/firestore";
import { db } from "../../../components/firebaseConfig";
import SkeletonBlock from "../../../components/SkeletonBlock/SkeletonBlock";

function WorkspaceItem() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [ownerName, setOwnerName] = useState("Loading...");
  const [users, setUsers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const workspaceSnap = await getDoc(doc(db, "workspaces", workspaceId));
        const usersSnap = await getDocs(collection(db, "users"));

        if (!workspaceSnap.exists()) throw new Error("Workspace not found");

        const workspaceData = { id: workspaceSnap.id, ...workspaceSnap.data() };
        const usersData = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        setWorkspace(workspaceData);
        setUsers(usersData);

        const owner = usersData.find((u) => u.uid === workspaceData.ownerId);
        setOwnerName(owner ? owner.name : "Unknown Owner");
      } catch (err) {
        console.error("Failed to fetch workspace or users:", err);
        setOwnerName("Failed to load owner");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleUpdateWorkspaceMembers = async (updatedMemberIds) => {
    try {
      const finalMemberIds = Array.from(new Set([workspace.ownerId, ...updatedMemberIds]));
      const previouslyAdded = workspace.memberIds || [];
      const newlyAdded = finalMemberIds.filter((id) => !previouslyAdded.includes(id));

      const updatedWorkspace = {
        ...workspace,
        memberIds: finalMemberIds,
      };

      await updateDoc(doc(db, "workspaces", workspace.id), {
        memberIds: finalMemberIds,
      });

      setWorkspace(updatedWorkspace);
      setShowMemberModal(false);

      for (const userId of newlyAdded) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const newCount = (userData.workspaceCount || 0) + 1;
          await updateDoc(userRef, { workspaceCount: newCount });
        }
      }
    } catch (err) {
      console.error("Error updating workspace members:", err);
    }
  };

  if (!workspace) return <p><SkeletonBlock/></p>;

  const memberUsers = users.filter((u) => workspace.memberIds.includes(u.uid));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.memberSection}>
          <h4>Members ({memberUsers.length})</h4>
          <ul className={styles.memberList}>
            {memberUsers.map((member) => (
              <li key={member.uid} className={styles.memberItem}>
                <img
                  src={
                    member.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${member.name}&background=random`
                  }
                  alt={member.name}
                  className={styles.avatar}
                />
                <div>
                  <span className={styles.memberName}>{member.name}</span>
                </div>
              </li>
            ))}
          </ul>

          {user.role === "supervisor" && (
            <button
              className={styles.addMembersButton}
              onClick={() => setShowMemberModal(true)}
            >
              + Add Members
            </button>
          )}
        </div>
        <p className={styles.description}>
          <span>
            <b>Description:</b>
          </span>{" "}
          {workspace.description}
        </p>
        <p className={styles.meta}>
          Owner: {ownerName} | Created: {" "}
          {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
      </div>

      {showMemberModal && workspace && (
        <MemberChecklistModal
          members={users.filter(
            (u) => u.groupId === workspace.groupId && u.status === "active"
          )}
          selected={workspace.memberIds}
          onClose={() => setShowMemberModal(false)}
          onChange={handleUpdateWorkspaceMembers}
          ownerId={workspace.ownerId}
        />
      )}
    </div>
  );
}

export default WorkspaceItem;
