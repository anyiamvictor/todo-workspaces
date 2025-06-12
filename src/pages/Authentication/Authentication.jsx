import React, { useState,useEffect } from "react";
import styles from "./Authentication.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import BackButton from "../../components/BackButton/BackButton";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContext";

function Authentication() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    phone: "",
    bio: "",
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:3001/users?email=${formData.email}`);
      const users = await res.json();

      if (isLogin) {
        const matchedUser = users.find(
          (u) => u.email === formData.email && u.password === formData.password
        );
        
        if (matchedUser) {
          login(matchedUser)          
          if (matchedUser.role === "admin") {
            navigate(`/admin/${matchedUser.groupId}`);
          } else {
            navigate("/dashboard");
          }
        } else {
          setError("Invalid email or password.");
        }
        
      } else {
        if (users.length > 0) {
          setError("Email already exists.");
        } else {
          const newUser = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            phone: formData.phone,
            bio: formData.bio,
            createdAt: new Date().toISOString(),
            status: "active",
          };
          
          const createRes = await fetch("http://localhost:3001/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
          })

          if (createRes.ok) {
            login(newUser);
            navigate("/dashboard");
          } else {
            setError("Failed to create account. Try again.");
          }
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* <BackButton /> */}
      <h2>{isLogin ? "Login to Your Account" : "Create a New Account"}</h2>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {!isLogin && (
  <>
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
        name="phone"
        placeholder="Enter your phone number"
        value={formData.phone}
        onChange={handleChange}
        required
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

    <div className={styles.formGroup}>
      <label>Select Role</label>
      <select name="role" value={formData.role} onChange={handleChange} required>
        <option value="member">Member</option>
        <option value="supervisor">Supervisor</option>
      </select>
    </div>
  </>
)}


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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p className={styles.toggleText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => {
            setIsLogin((prev) => !prev);
            setError("");
          }}
        >
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  );
}

export default Authentication;
