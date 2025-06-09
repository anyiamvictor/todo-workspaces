import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import Authentication from "./pages/Authentication/Authentication";
import UserProfileSettings from "./pages/UserProfileSetting/UserProfileSettings";
import Rootlayout from "./components/Rootlayout/Rootlayout";
import WorkspacesList from "./pages/WorkSpaces/WorkspacesList/WorkspacesList";
import Workspace from "./pages/WorkSpaces/Workspace/Workspace";
import Project from "./pages/WorkSpaces/Project/Project";
import TaskDetail from "./pages/WorkSpaces/TaskDetail/TaskDetail";
import AddEditTask from "./pages/WorkSpaces/AddEditTask/AddEditTask";
import WorkspaceLayout from "./components/WorkspaceLayout/WorkspaceLayout";
import ProjectLayout from "./components/ProjectLayout/ProjectLayout";
import PageNotFound from "./pages/PageNotFound/PageNotFound";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />

        {/* Private routes inside root layout */}
        <Route element={<Rootlayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/userprofile" element={<UserProfileSettings />} />

          <Route path="/workspaces" element={<WorkspacesList />} />

          <Route path="/workspaces/:workspaceId" element={<WorkspaceLayout />}>
            <Route index element={<Workspace />}/>
            <Route path="projects/:projectId" element={<ProjectLayout />}>
              <Route index element={<Project />} />
              <Route path="task/:taskId" element={<TaskDetail />} />
              <Route path="add-task" element={<AddEditTask />} />
            </Route>
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
