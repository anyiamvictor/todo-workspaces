import { BrowserRouter} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext/AuthContextFirebase";
import AppRoutes from "./AppRoutes";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
