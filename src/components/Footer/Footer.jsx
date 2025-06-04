import styles from "./Footer.module.css"; // optional CSS module

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2025 Todo-Workspaces. All rights reserved.</p>
      <p>
        Made with ❤️ by YourName
      </p>
    </footer>
  );
}

export default Footer;
