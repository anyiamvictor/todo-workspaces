import React, { useState } from "react";
import styles from "./SignupForm.module.css";
import {
  getDocs,
  collection,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../components/firebaseConfig";
import TextSpinner from "../TextSpinner/TextSpinner";
import { useNavigate } from "react-router-dom";

function SignupForm({ signup, setError, setInviteError }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    bio: "",
    inviteCode: "",
    status: "inactive",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteError, localInviteError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "inviteCode") {
      setInviteError(false);
      localInviteError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInviteError(false);
    localInviteError(false);
    setLoading(true);
    setSuccess(false);

    try {
      const snapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", formData.email))
      );
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (users.length > 0) {
        setError("Email already exists.");
        setLoading(false);
        return;
      }

      const groupSnapshot = await getDocs(
        query(collection(db, "groups"), where("inviteCode", "==", formData.inviteCode))
      );
      const matchedGroups = groupSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (matchedGroups.length === 0) {
        setInviteError(true);
        localInviteError(true);
        setError("Invalid invite code.");
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
        status: formData.status,
      });

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        bio: "",
        inviteCode: "",
        status: "inactive",
      });

      setTimeout(() => {
        setSuccess(false);
        navigate("/auth");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      {success && (
        <div className={styles.successMessage}>
          ✅ Account created! Please wait for admin approval.
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Full Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Phone Number</label>
        <input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Group Invite Code</label>
        <input
          name="inviteCode"
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
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          maxLength={120} 
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Password</label>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <button className={styles.submitButton} disabled={loading}>
        {loading ? <TextSpinner /> : "Sign Up"}
      </button>
    </form>
  );
}

export default SignupForm;
