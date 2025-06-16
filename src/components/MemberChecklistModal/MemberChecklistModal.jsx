import React, { useState, useEffect } from "react";
import styles from "./MemberChecklistModal.module.css"

function MemberChecklistModal({ members, selected, onChange, onClose, ownerId }) {
  const [filter, setFilter] = useState("");
  const [localSelected, setLocalSelected] = useState(selected);

  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleMember = (id) => {
    if (id === ownerId) return;
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const all = filteredMembers
      .map((m) => m.id)
      .filter((id) => id !== ownerId);
    setLocalSelected([...new Set([...localSelected, ...all])]);
  };

  const deselectAll = () => {
    setLocalSelected(localSelected.filter((id) => !filteredMembers.map((m) => m.id).includes(id)));
  };

  const handleSave = () => {
    onChange(localSelected);
    onClose();
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Select Members</h3>
          <p>{localSelected.length} selected</p>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.search}
        />

        <div className={styles.controls}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={deselectAll}>Deselect All</button>
        </div>

        <ul className={styles.memberList}>
          {filteredMembers.map((member) => (
            <li key={member.id}>
              <label>
                <input
                  type="checkbox"
                  checked={localSelected.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  disabled={member.id === ownerId}
                />
                {member.name}
                {member.id === ownerId && (
                  <span className={styles.ownerNote}> (Creator - cannot be removed)</span>
                )}
                
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default MemberChecklistModal;
