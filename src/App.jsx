import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import Authentication from "./pages/Authentication/Authentication";
import UserProfileSettings from "./pages/UserProfileSetting/UserProfileSettings";
import Rootlayout from "./components/Rootlayout/Rootlayout";
import WorkspacesList from "./pages/WorkSpaces/WorkspacesList/WorkspacesList";
import WorkspaceItem from "./pages/WorkSpaces/WorkspaceItem/WorkspaceItem";
import Project from "./pages/WorkSpaces/Project/Project";
import TaskDetail from "./pages/WorkSpaces/TaskDetail/TaskDetail";
import AddEditTask from "./components/AddEditTaskModal/AddEditTaskModal";
import WorkspaceLayout from "./components/WorkspaceLayout/WorkspaceLayout";
import PageNotFound from "./pages/PageNotFound/PageNotFound";
import ProjectList from "./components/ProjectList/ProjectList";
import Admin from "./pages/Admin/Admin";
import RoleProtectedRoute from "./components/RoleProtectedoute";
import Registration from "./pages/Registration/Registration";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Authentication />} />

          <Route
            path="/admin/:groupId"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={ <Registration/> }
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Rootlayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/userprofile" element={<UserProfileSettings />} />
            <Route path="/workspaces" element={<WorkspacesList />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<WorkspaceItem />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/:projectId" element={<Project />}>
                <Route path="task/:taskId" element={<TaskDetail />} />
                <Route path="add-task" element={<AddEditTask />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
