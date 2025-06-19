import { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../components/firebaseConfig";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const navigate = useNavigate();

  const SESSION_KEY = "loggedInUser";

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const res = await fetch(`http://localhost:3001/users?uid=${firebaseUser.uid}`);
      const dbUsers = await res.json();

      if (dbUsers.length > 0) {
        const user = dbUsers[0];

        if (user.status !== "active") {
          alert("Your account is not yet activated.");
          await signOut(auth);
          return;
        }

        sessionStorage.setItem("loggedInUser", JSON.stringify(user));
        navigate(user.role === "admin" ? `/admin/${user.groupId}` : "/dashboard", { replace: true });
      } else {
        setPendingGoogleUser(firebaseUser);
        setShowInvitePrompt(true);
      }
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      alert("Google login failed. Please try again.");
    }
  };

  const completeGoogleSignup = async (inviteCode, bio) => {
    if (!pendingGoogleUser) return;

    try {
      const res = await fetch(`http://localhost:3001/groups?inviteCode=${inviteCode}`);
      const matchedGroups = await res.json();
      if (matchedGroups.length === 0) {
        throw new Error("Invalid invite code.");
      }

      const group = matchedGroups[0];

      const newUser = {
        id: `u-${crypto.randomUUID()}`,
        uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        name: pendingGoogleUser.displayName || "",
        phoneNumber: pendingGoogleUser.phoneNumber || "",
        bio,
        role: "member",
        status: "inactive",
        isOnline: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        avatarUrl: pendingGoogleUser.photoURL || "https://randomuser.me/api/portraits/men/7.jpg",
        groupId: group.id,
        pendingCount: 0,
        completedCount: 0,
        rejectedCount: 0,
        approvedCount: 0,
        totalAssignedTask: 0,
        workspaceCount: 0,
        totalProjectsCompleted: 0,
      };

      await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      alert("Google account registered. Please wait for admin approval.");
      setPendingGoogleUser(null);
      setShowInvitePrompt(false);
      await logout();
    } catch (error) {
      console.error("Google user registration failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const logout = async (message) => {
    try {
      if (user) {
        await fetch(`http://localhost:3001/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isOnline: false,
            lastSeen: new Date().toISOString(),
          }),
        });
      }

      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }

    sessionStorage.clear();
    setUser(null);
    if (message) alert(message);
    navigate("/auth", { replace: true });
  };

  const signup = async (email, password, extraFields = {}) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      const isAdmin = extraFields.role === "admin";
      const newUser = {
        id: `u-${crypto.randomUUID()}`,
        uid,
        email,
        name: extraFields.name || "",
        phoneNumber: extraFields.phoneNumber || "",
        bio: extraFields.bio || "",
        role: isAdmin ? "admin" : "member",
        status: isAdmin ? "active" : "inactive",
        isOnline: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        avatarUrl: extraFields.avatarUrl || "https://randomuser.me/api/portraits/men/7.jpg",
        groupId: extraFields.groupId || null,
        pendingCount: 0,
        completedCount: 0,
        rejectedCount: 0,
        approvedCount: 0,
        totalAssignedTask: 0,
        workspaceCount: 0,
        totalProjectsCompleted: 0,
      };

      await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      return newUser;
    } catch (err) {
      console.error("Signup failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await fetch(`http://localhost:3001/users?uid=${firebaseUser.uid}`);
          const data = await res.json();
          const dbUser = data[0];

          if (!dbUser || dbUser.status !== "active") {
            await logout("Your account is inactive.");
            return;
          }

          await fetch(`http://localhost:3001/users/${dbUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isOnline: true,
              lastLogin: new Date().toISOString(),
            }),
          });

          sessionStorage.setItem(SESSION_KEY, JSON.stringify(dbUser));
          setUser({ ...dbUser, firebaseUser });
        } catch (err) {
          console.error("User fetch failed:", err);
          await logout("Session verification failed.");
        }
      } else {
        setUser(null);
        sessionStorage.clear();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout("You’ve been logged out due to inactivity.");
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/users/${user.id}`);
        const freshUser = await res.json();

        if (
          freshUser.status !== "active" ||
          freshUser.uid !== auth.currentUser?.uid
        ) {
          await logout("Your session has ended or your account was deactivated.");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        await logout("Unable to verify your session.");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        try {
          await fetch(`http://localhost:3001/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isOnline: false,
              lastSeen: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Unload update failed:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        loading,
        googleSignIn,
        completeGoogleSignup,
        pendingGoogleUser,
        showInvitePrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
