import { createContext, useContext, useEffect, useState } from "react";
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
  const navigate = useNavigate();

  const SESSION_KEY = "loggedInUser";
  const TOKEN_KEY = "sessionToken";
  const SESSION_TOKEN_KEY = "localSessionToken";

  const getLocalSessionId = () => {
    let token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  };
  
  const LOCAL_SESSION_ID = getLocalSessionId();
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await fetch(
            `http://localhost:3001/users?uid=${firebaseUser.uid}`
          );
          const data = await res.json();
          const dbUser = data[0];

          if (!dbUser || dbUser.status !== "active") {
            await logout("Your account is inactive.");
            return;
          }

          // Check existing session token to enforce single session
          if (dbUser.sessionToken && dbUser.sessionToken !== LOCAL_SESSION_ID) {
            await logout(
              "You were logged out because your account was signed in elsewhere."
            );
            return;
          }

          // Update sessionToken, online status, and lastLogin timestamp in DB
          await fetch(`http://localhost:3001/users/${dbUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionToken: LOCAL_SESSION_ID,
              isOnline: true,
              lastLogin: new Date().toISOString(),
            }),
          });

          // Store user and token in sessionStorage
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(dbUser));
          sessionStorage.setItem(TOKEN_KEY, LOCAL_SESSION_ID);

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

  // Inactivity logout after 15 min of no activity
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

  // Periodic session validity check (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/users/${user.id}`);
        const freshUser = await res.json();

        if (
          freshUser.status !== "active" ||
          freshUser.uid !== auth.currentUser?.uid ||
          freshUser.sessionToken !== LOCAL_SESSION_ID
        ) {
          await logout(
            "Your session has ended, was disabled, or logged in elsewhere."
          );
        }
      } catch (err) {
        console.error("Session check failed:", err);
        await logout("Unable to verify your session.");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Update isOnline and lastSeen on tab/browser close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        try {
          await fetch(`http://localhost:3001/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isOnline: false,
              sessionToken: null,
              lastSeen: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Unload update failed:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  // Login method using Firebase Auth
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  // Logout method using Firebase Auth and clears sessionToken & online status in DB
  const logout = async (message) => {
    try {
      if (user) {
        await fetch(`http://localhost:3001/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isOnline: false,
            sessionToken: null,
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

  // Signup method (Firebase + JSON DB)
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
        sessionToken: null,
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

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
