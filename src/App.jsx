import { BrowserRouter} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext/AuthContextFirebase";
import AppRoutes from "./AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      
    </>
  
  );
}

export default App;
