import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const SESSION_KEY = "loggedInUser";
  const TOKEN_KEY = "sessionToken";

  // Initial auth check
  useEffect(() => {
    const verifySession = async () => {
      const savedUser = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      const sessionToken = sessionStorage.getItem(TOKEN_KEY);

      if (!savedUser || !sessionToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3001/users/${savedUser.id}`);
        if (!res.ok) throw new Error("User fetch failed");

        const dbUser = await res.json();

        if (dbUser.sessionToken === sessionToken) {
          setUser(dbUser);
          await refreshOnlineStatus(dbUser.id);
        } else {
          await logout("You’ve been logged out from another session.");
        }
      } catch (err) {
        console.error("Session verification error:", err);
        await logout("Session verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Refresh online status
  const refreshOnlineStatus = async (userId) => {
    try {
      await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: true }),
      });
    } catch (err) {
      console.error("Failed to refresh online status:", err);
    }
  };

  // Inactivity auto logout
  useEffect(() => {
    if (!user) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout("You’ve been logged out due to inactivity.");
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, [user]);



  // Session refresh check every 30 seconds
useEffect(() => {
  if (!user) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:3001/users/${user.id}`);
      if (!res.ok) throw new Error("Session check failed");

      const freshUser = await res.json();

      const storedToken = sessionStorage.getItem("sessionToken");

      // Check for session mismatch(not to allow logging in from more than one browser)
      if (
        freshUser.sessionToken !== storedToken ||
        freshUser.status !== "active"
      ) {
        await logout("Your session has ended or your account was logged out. Log in again.");
      }
    } catch (err) {
      console.error("Failed session refresh check:", err);
      await logout("Unable to verify your session. Logging out.");
    }
  }, 5000); // Every 30 seconds

  return () => clearInterval(interval);
}, [user]);


  // Browser/tab close handling
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
          console.error("Failed to update user on unload:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  // Login
  const login = async (userData) => {
    const token = crypto.randomUUID();

    try {
      const res = await fetch(`http://localhost:3001/users/${userData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOnline: true,
          sessionToken: token,
          lastSeen: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update user login session");

      const updatedUser = { ...userData, sessionToken: token };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // Logout
  const logout = async (message) => {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);

    if (user && sessionToken) {
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
        console.error("Failed to logout cleanly:", err);
      }
    }

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);

    if (message) alert(message);
    navigate("/auth", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
