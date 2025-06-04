import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import AddEditTask from "./pages/WorkSpaces/AddEditTask/AddEditTask";
import TaskDetail from "./pages/WorkSpaces/TaskDetail/TaskDetail";
import Authentication from "./pages/Authentication/Authentication";
import UserProfileSettings from "./pages/UserProfileSetting/UserProfileSettings";
import Rootlayout from "./components/Rootlayout/Rootlayout";
import WorkspacesList from "./pages/Workspaces/WorkspacesList/WorkspacesList";
import Workspace from "./pages/Workspaces/Workspace/Workspace";
import Project from "./pages/Workspaces/Project/Project";
import PageNotFound from "./pages/PageNotFOund/PageNotFound";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />

        {/* Private pages (wrapped in layout) */}
        <Route element={<Rootlayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/userprofile" element={<UserProfileSettings />} />
          <Route path="/workspaces" element={<WorkspacesList />} />
          <Route path="/workspaces/:workspaceId" element={<Workspace />} />
          <Route path="/workspaces/:workspaceId/projects/:projectId" element={<Project />} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/task/:taskId" element={<TaskDetail />} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/add-task" element={<AddEditTask />} />

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
               
    </BrowserRouter>
  );
}

export default App
