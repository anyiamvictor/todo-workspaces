import React, { useState, useEffect } from "react";
import styles from "./Authentication.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import LoginForm from "../../components/Login Form/LoginForm";
import SignupForm from "../../components/SignupForm/SignupForm";
import { motion, AnimatePresence } from "framer-motion";
import { getDocs, collection } from "firebase/firestore";
import {db} from "../../components/firebaseConfig"

function Authentication() {
  const {
    login,
    signup,
    googleSignIn,
    user,
    pendingGoogleUser,
    showInvitePrompt,
    completeGoogleSignup,
  } = useAuth();

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState(false);
  const [bio, setBio] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user?.groupId) {
      if (user.role === "admin") navigate(`/admin/${user.groupId}`);
      else navigate("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    if (successMsg || error) {
      const timeout = setTimeout(() => {
        setSuccessMsg("");
        setError("");
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg, error]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    try {
      const snapshot = await getDocs(collection(db, "groups"));
      const allGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const matchedGroup = allGroups.find(
        (group) => group.inviteCode === inviteCode
      );

      if (!matchedGroup) {
        setInviteError(true);
        setError("Invalid invite code. Please double-check and try again.");
        return;
      }

      await completeGoogleSignup(inviteCode, bio);
      setInviteError(false);
      setError("");
      setSuccessMsg("Account created successfully. Awaiting admin approval.");
      setInviteCode("");
      setBio("");
    } catch (err) {
      console.error("Invite submission failed:", err);
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className={styles.authPage}>
      <h2>{isLogin ? "Login to Your Account" : "Create a New Account"}</h2>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            className={styles.successBanner}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {successMsg}
          </motion.div>
        )}
        {error && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isLogin ? (
        <LoginForm login={login} googleSignIn={googleSignIn} setError={setError} />
      ) : (
        <SignupForm signup={signup} setError={setError} setInviteError={setInviteError} />
      )}

      <p className={styles.toggleText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          className={styles.toggleButton}
          onClick={() => {
            setIsLogin((prev) => !prev);
            setError("");
            setSuccessMsg("");
          }}
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>

      {showInvitePrompt && pendingGoogleUser && (
        <div className={styles.inviteModalOverlay}>
          <div className={styles.inviteModal}>
            <h3>Complete Your Signup</h3>
            <form onSubmit={handleInviteSubmit}>
              <input
                type="text"
                placeholder="Enter Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <textarea
                placeholder="Short bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                required
              />
              <button type="submit">Join Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Authentication;
