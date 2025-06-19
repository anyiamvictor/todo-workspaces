// components/SignupForm.jsx
import React, { useState } from "react";
import styles from "./SignupForm.module.css";

function SignupForm({ signup, setError, setInviteError }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    bio: "",
    inviteCode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInviteError(false);
    setLoading(true);

    try {
      const exists = await fetch(`http://localhost:3001/users?email=${formData.email}`);
      const users = await exists.json();
      if (users.length > 0) {
        setError("Email already exists.");
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3001/groups?inviteCode=${formData.inviteCode}`);
      const groups = await res.json();
      if (groups.length === 0) {
        setInviteError(true);
        setError("Invalid invite code.");
        setLoading(false);
        return;
      }

      await signup(formData.email, formData.password, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        role: "member",
        groupId: groups[0].id,
      });

      alert("Account created. Please wait for admin approval.");
    } catch (err) {
      console.error(err);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label>Full Name</label>
        <input name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className={styles.formGroup}>
        <label>Phone Number</label>
        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
      </div>

      <div className={styles.formGroup}>
        <label>Group Invite Code</label>
        <input
          name="inviteCode"
          value={formData.inviteCode}
          onChange={handleChange}
          required
          className={styles.inputError}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Bio</label>
        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} required />
      </div>

      <div className={styles.formGroup}>
        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className={styles.formGroup}>
        <label>Password</label>
        <input name="password" type="password" value={formData.password} onChange={handleChange} required />
      </div>

      <button className={styles.submitButton} disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}

export default SignupForm;
