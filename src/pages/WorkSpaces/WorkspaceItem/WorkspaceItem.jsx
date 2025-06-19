import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./WorkspaceItem.module.css";
import MemberChecklistModal from "../../../components/MemberChecklistModal/MemberChecklistModal";
import {useAuth} from "../../../contexts/AuthContext/AuthContextFirebase"

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
        const [workspaceRes, usersRes] = await Promise.all([
          fetch(`http://localhost:3001/workspaces/${workspaceId}`),
          fetch("http://localhost:3001/users"),
        ]);

        const workspaceData = await workspaceRes.json();
        const usersData = await usersRes.json();

        setWorkspace(workspaceData);
        setUsers(usersData);

        const owner = usersData.find((u) => u.id === workspaceData.ownerId);
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

      // Identify newly added members
      const previouslyAdded = workspace.memberIds || [];
      const newlyAdded = finalMemberIds.filter((id) => !previouslyAdded.includes(id));

      // Update workspace
      const updatedWorkspace = {
        ...workspace,
        memberIds: finalMemberIds,
      };

      const res = await fetch(`http://localhost:3001/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkspace),
      });

      if (!res.ok) throw new Error("Failed to update members");

      setWorkspace(updatedWorkspace);
      setShowMemberModal(false);

      // Increment workspaceCount for newly added members
      await Promise.all(
        newlyAdded.map(async (userId) => {
          const userRes = await fetch(`http://localhost:3001/users/${userId}`);
          const userData = await userRes.json();
          const newCount = (userData.workspaceCount || 0) + 1;

          await fetch(`http://localhost:3001/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceCount: newCount }),
          });
        })
      );
    } catch (err) {
      console.error("Error updating workspace members:", err);
    }
  };

  if (!workspace) return <p>Loading workspace...</p>;

  const memberUsers = users.filter((u) => workspace.memberIds.includes(u.id));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.memberSection}>
          <h4>Members ({memberUsers.length})</h4>
          <ul className={styles.memberList}>
            {memberUsers.map((member) => (
              <li key={member.id} className={styles.memberItem}>
                <img
                  src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                  alt={member.name}
                  className={styles.avatar}
                />
                <div>
                  <span className={styles.memberName}>{member.name}</span>
                  {/* <span className={styles.memberId}>({member.id})</span> */}
                </div>
              </li>
    
            ))}
          </ul>

       { user.role==="supervisor" &&  <button
            className={styles.addMembersButton}
            onClick={() => setShowMemberModal(true)}
          >
            + Add Members
          </button>}
        </div>
        <p className={styles.description}><span><b>Description:</b></span>   {workspace.description}</p>
        <p className={styles.meta}>
          Owner: {ownerName} | Created:{" "}
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
