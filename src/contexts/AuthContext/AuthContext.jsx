import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // wait for session check
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (savedUser) setUser(savedUser);
    setLoading(false);
  }, []);

  // Auto logout on inactivity (10 seconds for demo)
  useEffect(() => {
    if (!user) return;

    let timer;
    const logoutTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout("You have been logged out due to inactivity.");
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, logoutTimer));
    logoutTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, logoutTimer));
      clearTimeout(timer);
    };
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem("loggedInUser", JSON.stringify(userData));
  };

  const logout = (message) => {
    setUser(null);
    sessionStorage.removeItem("loggedInUser");
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
