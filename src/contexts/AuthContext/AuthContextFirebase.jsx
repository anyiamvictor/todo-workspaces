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
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../components/firebaseConfig";
import { useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const navigate = useNavigate();
const location = useLocation();


  const SESSION_KEY = "loggedInUser";

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const q = query(collection(db, "users"), where("uid", "==", firebaseUser.uid));
      const snapshot = await getDocs(q);
      const dbUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (dbUsers.length > 0) {
        const user = dbUsers[0];

        if (user.status !== "active") {
          await signOut(auth);
          return;
        }

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
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
      const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode));
      const snapshot = await getDocs(q);
      const matchedGroups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (matchedGroups.length === 0) throw new Error("Invalid invite code.");
      const group = matchedGroups[0];

      const newUser = {
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

      await setDoc(doc(db, "users", newUser.uid), newUser);
      setPendingGoogleUser(null);
      setShowInvitePrompt(false);
      await logout();
    } catch (error) {
      console.error("Google user registration failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
    }
  };

  const signup = async (email, password, extraFields = {}) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      const isAdmin = extraFields.role === "admin";
      const newUser = {
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

      console.log("✅ Firebase Auth user UID:", uid);
      await setDoc(doc(db, "users", uid), newUser);
      console.log("✅ User saved to Firestore:", newUser);

      return newUser;
    } catch (err) {
      console.error("❌ Signup failed:", err.code, err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.reload();
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: new Date().toISOString(),
        });
      }

      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }

    sessionStorage.clear();
    setUser(null);
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const q = query(collection(db, "users"), where("uid", "==", firebaseUser.uid));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const dbUser = data[0];

          if (!dbUser || dbUser.status !== "active") {
            return;
          }

          const userRef = doc(db, "users", dbUser.uid);
          await updateDoc(userRef, {
            isOnline: true,
            lastLogin: new Date().toISOString(),
          });

          sessionStorage.setItem(SESSION_KEY, JSON.stringify(dbUser));
          setUser({ ...dbUser, firebaseUser });
          if (location.pathname === "/auth") navigate(dbUser.role === "admin" ? `/admin/${dbUser.groupId}` : "/dashboard", {
              replace: true,
            })
          
        } catch (err) {
          console.error("User fetch failed:", err);
          await logout();
        }
      } else {
        setUser(null);
        sessionStorage.clear();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
