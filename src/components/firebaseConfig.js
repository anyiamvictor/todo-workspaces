// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJW4TDusv2Hah_xYFUqd_groteoqdpud8",
  authDomain: "todoworkspaces.firebaseapp.com",
  projectId: "todoworkspaces",
  storageBucket: "todoworkspaces.firebasestorage.app",
  messagingSenderId: "526243492507",
  appId: "1:526243492507:web:e88874d7dd97c319a08c3e",
  measurementId: "G-PSY5DBTYM7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };

/*

🔐 Firebase Authentication Setup (React + Firebase)
✅ Step 1: Enable Authentication in Firebase Console
Go to Firebase Console

Choose your project

Click Build > Authentication

Click “Get Started”

Under Sign-in method, enable:

Email/Password

(Optional) Google, Phone, etc.

✅ Step 2: Firebase Auth Setup in Code
Assuming you’ve created firebase.js as described earlier:

js
Copy
Edit
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
✅ Step 3: AuthContext (Global State)
Create a new file: contexts/AuthContext.js

js
Copy
Edit
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user: currentUser, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
Wrap your App in this provider:

jsx
Copy
Edit
// index.js or App.jsx
import { AuthProvider } from "./contexts/AuthContext";

<React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
</React.StrictMode>
✅ Step 4: Signup & Login Functions
Create firebaseAuth.js:

js
Copy
Edit
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
✅ Step 5: Signup/Login Form Example
jsx
Copy
Edit
import React, { useState } from "react";
import { login, signup } from "../firebaseAuth";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      isLogin ? await login(email, password) : await signup(email, password);
      navigate("/dashboard"); // or wherever
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isLogin ? "Login" : "Signup"}</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">{isLogin ? "Login" : "Signup"}</button>
      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
        {isLogin ? "Don't have an account? Signup" : "Already have an account? Login"}
      </p>
    </form>
  );
}

export default AuthPage;
✅ Step 6: Protecting Routes
jsx
Copy
Edit
// PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}
Use it in routes:

jsx
Copy
Edit
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
✅ What's Next?
You now have:

🔑 Email/password auth

🔒 Protected routes

🌐 Global auth state via context

Would you like to:

Add Google Sign-in?

Save user info (like name, bio) to Firestore after signup?

Move to Firestore for your app database?

Let me know what you'd like next.*/
