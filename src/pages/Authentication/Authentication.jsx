import React, { useState, useEffect } from "react";
import styles from "./Authentication.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import { motion, AnimatePresence } from "framer-motion";

function Authentication() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    phoneNumber: "",
    bio: "",
    inviteCode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Redirect after login if login/signup was just completed
  useEffect(() => {
    if (!loading && user && user.groupId) {
      if (user.role === "admin") {
        navigate(`/admin/${user.groupId}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInviteError(false);
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:3001/users?email=${formData.email}`);
      const users = await res.json();

      if (isLogin) {
        if (users.length === 0) {
          setError("Account not found or not yet approved.");
          setLoading(false);
          return;
        }

        const matchedUser = users[0];
        if (matchedUser.status !== "active") {
          setError("Account is not yet activated. Please contact your administrator.");
          setLoading(false);
          return;
        }

        await login(formData.email, formData.password);

      } else {
        if (users.length > 0) {
          setError("Email already exists.");
          setLoading(false);
          return;
        }

        const inviteRes = await fetch(`http://localhost:3001/groups?inviteCode=${formData.inviteCode}`);
        const matchedGroups = await inviteRes.json();

        if (matchedGroups.length === 0) {
          setInviteError(true);
          setError("Invalid invite code. Please check with your administrator.");
          setLoading(false);
          return;
        }

        const matchedGroup = matchedGroups[0];

        await signup(formData.email, formData.password, {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
          role: "member",
          groupId: matchedGroup.id,
        });

        alert("Account created successfully! Please wait for admin approval before logging in.");
        setIsLogin(true);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "member",
          phoneNumber: "",
          bio: "",
          inviteCode: "",
        });
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <h2>{isLogin ? "Login to Your Account" : "Create a New Account"}</h2>

      <div className={`${styles.formWrapper} ${isLogin ? styles.slideInLogin : styles.slideInSignup}`}>
        <form className={styles.authForm} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Group Invite Code</label>
                  <input
                    type="text"
                    name="inviteCode"
                    placeholder="Enter invite code from your admin"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    required
                    className={inviteError ? styles.inputError : ""}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    placeholder="Write a short bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className={styles.eyeIcon}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Processing..." : "Connect"}
          </button>
        </form>
      </div>

      <p className={styles.toggleText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => {
            setIsLogin((prev) => !prev);
            setError("");
            setInviteError(false);
          }}
        >
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  );
}

export default Authentication;
