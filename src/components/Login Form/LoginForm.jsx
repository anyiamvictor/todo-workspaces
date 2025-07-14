// components/LoginForm.jsx
// when iregister a new member and login in, it doesnt log in until i refresh the page
//when a registerd member logs in, it should  redirects to the dashboard
import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import TextSpinner from "../TextSpinner/TextSpinner";
import BackButton from "../BackButton/Backbutton"
function LoginForm({ login, googleSignIn, setError }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      
      const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", formData.email)));
      const users = snapshot.docs.map(doc =>({id:doc.id, ...doc.data()}))
      if (users.length === 0 || users[0].status !== "active") {

        setError("Account not found or not yet approved.");
        setLoading(false);
        return;
      }

      await login(formData.email, formData.password);
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className={styles.formGroup}>
        <label>Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span onClick={() => setShowPassword((p) => !p)} className={styles.eyeIcon}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
      </div>

      <button className={styles.submitButton} disabled={loading}>
        {loading ? <TextSpinner/>: "Login"}
      </button>

      <div className={styles.container}>
        <button type="button" className={styles.googleBtn} onClick={googleSignIn}>
          <FcGoogle className={styles.icon} />
        </button>
      </div>
      {/* <BackButton/> */}
    </form>
  );
}

export default LoginForm;
