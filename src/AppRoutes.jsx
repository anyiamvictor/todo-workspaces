import {Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedoute";
import Home from "./pages/Home/Home";
import Authentication from "./pages/Authentication/Authentication";
import Registration from "./pages/Registration/Registration";
import Dashboard from "./pages/Dashboard/Dashboard";
import UserProfile from "./pages/UserProfile/UserProfile";
import WorkspacesList from "./pages/WorkSpaces/WorkspacesList/WorkspacesList";
import WorkspaceItem from "./pages/WorkSpaces/WorkspaceItem/WorkspaceItem";
import WorkspaceLayout from "./components/WorkspaceLayout/WorkspaceLayout";
import ProjectList from "./components/ProjectList/ProjectList";
import ProjectTaskList from "./pages/WorkSpaces/ProjectTaskList/ProjectTaskList";
// import AddEditTask from "./components/AddEditTaskModal/AddEditTaskModal";
import PageNotFound from "./pages/PageNotFound/PageNotFound";
import Rootlayout from "./components/Rootlayout/Rootlayout";
import Admin from "./pages/Admin/Admin";
import TaskItem from "./components/TaskItem/TaskItem";
import { useAuth } from "./contexts/AuthContext/AuthContextFirebase";
import TextSpinner from "./components/TextSpinner/TextSpinner";

function App() {
  const { loading } = useAuth();

  if (loading) return <TextSpinner />;
  return (
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/register" element={<Registration />} />

          {/* Admin Protected */}
          <Route
            path="/admin/:groupId"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </RoleProtectedRoute>
            }
          />

          {/* General Protected */}
          <Route
            element={
              <ProtectedRoute>
                <Rootlayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/userprofile" element={<UserProfile />} />
            <Route path="/workspaces" element={<WorkspacesList />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<WorkspaceItem />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/:projectId" element={<ProjectTaskList />}>
                <Route path="task/:taskId" element={<TaskItem />} />
                {/* <Route path="add-task" element={<AddEditTask />} /> */}
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
  );
}

export default App;
