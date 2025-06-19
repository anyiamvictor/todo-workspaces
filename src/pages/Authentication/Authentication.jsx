import React, { useState, useEffect } from "react";
import styles from "./Authentication.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import LoginForm from "../../components/Login Form/LoginForm";
import SignupForm from "../../components/SignupForm/SignupForm";

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
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user?.groupId) {
      if (user.role === "admin") navigate(`/admin/${user.groupId}`);
      else navigate("/dashboard");
    }
  }, [user]);


  const handleInviteSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Get all groups
      const res = await fetch("http://localhost:3001/groups");
      const allGroups = await res.json();
  
      // Check if any group has the entered invite code
      const matchedGroup = allGroups.find(group => group.inviteCode === inviteCode);
  
      if (!matchedGroup) {
        alert("Invalid invite code. Please double-check and try again.");
        return;
      }
  
      // Proceed to register
      await completeGoogleSignup(inviteCode, bio);
  
      // Clear sensitive fields after submission
      setInviteCode("");
      setBio("");
    } catch (err) {
      console.error("Invite submission failed:", err);
      alert(err.message || "Something went wrong.");
    }
  };
  
  

  return (
    <div className={styles.authPage}>
      <h2>{isLogin ? "Login to Your Account" : "Create a New Account"}</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {isLogin ? (
        <LoginForm login={login} googleSignIn={googleSignIn} setError={setError} />
      ) : (
        <SignupForm signup={signup} setError={setError} />
      )}

      <p className={styles.toggleText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button className={styles.toggleButton} onClick={() => setIsLogin((prev) => !prev)}>
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
