import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import AddEditTask from "./pages/AddEditTask/AddEditTask";
import TaskDetail from "./pages/TaskDetail/TaskDetail";
import Authentication from "./pages/Authentication/Authentication";
import UserProfileSettings from "./pages/UserProfileSetting/UserProfileSettings";
import WorkSpace from "./pages/WorkSpace/WorkSpace";
import PageNotFound from "./pages/PageNotFOund/PageNotFound";
import Rootlayout from "./components/Rootlayout/Rootlayout";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />

        <Route element={<Rootlayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user-profile" element={<UserProfileSettings />} />
          <Route path="/workspaces" element={<WorkSpace />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/addedittask" element={<AddEditTask />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
               
      </Routes>
    </BrowserRouter>
  );
}

export default App
