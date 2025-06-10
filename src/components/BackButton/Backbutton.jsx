import { useNavigate } from "react-router-dom";
import styles from "./BackButton.module.css";

function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back one page
  };

  return (
    <button onClick={handleBack} className={styles.backButton}>
      ← Back
    </button>
  );
}

export default BackButton;
