import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import styles from "./Registration.module.css";

function Registration() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
    phoneNumber: "",
    bio: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userRes = await fetch(`http://localhost:3001/users?email=${form.email}`);
      const existingUsers = await userRes.json();

      if (existingUsers.length > 0) {
        setError("Email already exists.");
        setLoading(false);
        return;
      }
      const newGroupId = `g-${crypto.randomUUID()}`;

      const adminId = `u-${crypto.randomUUID()}`;
        const newUser = {
            id: adminId,
            name: form.adminName,
            email: form.email,
            password: form.password,
            phoneNumber: form.phoneNumber,
            bio: form.bio,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            lastLogin: null,
            groupId: newGroupId,
            avatarUrl: null
        };

      const createUser = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!createUser.ok) throw new Error("Failed to create user");

      const newGroup = {
        id: newGroupId,
        name: form.companyName,
        adminId: adminId,
      };

      const createGroup = await fetch("http://localhost:3001/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (!createGroup.ok) throw new Error("Failed to create group");

      login({ ...newUser, groupId: newGroupId });
      navigate(`/admin/${newGroupId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Register a Company</h2>
      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Company Name</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Admin Name</label>
          <input
            name="adminName"
            value={form.adminName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Phone</label>
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Register Company"}
        </button>
      </form>
    </div>
  );
}

export default Registration;
