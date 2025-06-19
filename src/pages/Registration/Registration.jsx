import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import styles from "./Registration.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Friendly error messages
const getFriendlyMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
};

function Registration() {
  const { signup } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Check for duplicate email in DB
      const res = await fetch(`http://localhost:3001/users?email=${form.email}`);
      const existing = await res.json();
      if (existing.length > 0) {
        setError("Email already exists.");
        setLoading(false);
        return;
      }

      const newGroupId = `g-${crypto.randomUUID()}`;

      // ✅ Register admin user
      const newUser = await signup(form.email, form.password, {
        name: form.adminName,
        phoneNumber: form.phoneNumber,
        bio: form.bio,
        role: "admin",
        status: "active",
        groupId: newGroupId,
        avatarUrl: "https://randomuser.me/api/portraits/men/7.jpg", // optional fallback
      });

      // ✅ Create new group entry
      const newGroup = {
        id: newGroupId,
        name: form.companyName,
        adminId: newUser.uid,
        registrationDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      };

      const groupRes = await fetch("http://localhost:3001/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (!groupRes.ok) throw new Error("Failed to create group");

      alert("Registration successful! Please log in.");
      navigate("/auth", { replace: true });

    } catch (err) {
      console.error("Signup error:", err);
      if (err.code?.startsWith("auth/")) {
        setError(getFriendlyMessage(err.code));
      } else {
        setError("An unexpected error occurred.");
      }
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
          <input name="companyName" value={form.companyName} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label>Admin Name</label>
          <input name="adminName" value={form.adminName} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label>Password</label>
          <div className={styles.passwordWrapper}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
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

        <div className={styles.formGroup}>
          <label>Phone Number</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>

        <div className={styles.formGroup}>
          <label>Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Register Company"}
        </button>
      </form>
    </div>
  );
}

export default Registration;
