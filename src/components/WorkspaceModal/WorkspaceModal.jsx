import styles from "./WorkspaceModal.module.css";

function WorkspaceModal({ onClose, onSubmit }) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3 className={styles.heading}>Add New Workspace</h3>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Workspace Name:
            <input type="text" name="name" required />
          </label>

          <label>
            Description:
            <textarea name="description" required />
          </label>

          <label>
            Owner ID:
            <input type="text" name="ownerId" required />
          </label>

          <label>
            Members (comma-separated user IDs):
            <input type="text" name="memberIds" />
          </label>

          <div className={styles.actions}>
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorkspaceModal;
