import React, { useEffect, useState } from "react";
import styles from "./WorkspaceModal.module.css";
import MemberChecklistModal from "../MemberChecklistModal/MemberChecklistModal";
import { createNotifications } from "../createNotifications";

function WorkspaceModal({ user, onClose, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const res = await fetch("http://localhost:3001/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        setErrorUsers(error.message);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  const groupMembers = users
    .filter((u) => u.groupId === user.groupId && u.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));

    const handleSubmit = async (e) => {
      e.preventDefault();
      const allMemberIds = [...new Set([user.id, ...selectedMemberIds])];
    
      const newWorkspace = {
        id: `ws${Date.now()}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        ownerId: user.id,
        memberIds: allMemberIds,
        groupId: user.groupId,
      };
    
      try {
        // Update workspace counts for all involved users
        await Promise.all(
          allMemberIds.map(async (memberId) => {
            const res = await fetch(`http://localhost:3001/users/${memberId}`);
            if (!res.ok) throw new Error("Failed to fetch user");
    
            const userData = await res.json();
            const updatedCount = (userData.workspaceCount || 0) + 1;
    
            await fetch(`http://localhost:3001/users/${memberId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workspaceCount: updatedCount }),
            });
          })
        );
    
        // 🔔 Notify only selected members (not the creator)
        await Promise.all(
          selectedMemberIds.map((memberId) =>
            createNotifications({
              userId: memberId,
              message: `You've been added to a new workspace: "${name}"`,
            })
          )
        );
    
        onSubmit(newWorkspace);
      } catch (err) {
        console.error("Error during workspace creation:", err);
      }
    };
    
    

  if (loadingUsers) return <p>Loading users...</p>;
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
            <button type="submit">Create</button>
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
            ownerId={user.id}
          />
        )}
      </div>
    </div>
  );
}

export default WorkspaceModal;
