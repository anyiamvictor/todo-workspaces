import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import TaskForm from "./TaskForm";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { createNotifications } from "../createNotifications";
import { updateUserStat } from "../StatHandler/";

export default function AddTaskHandler({ projectId, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: null,
    dueDate: "",
    status: "pending",
    priority: "medium",
    workspaceId: "", // ✅ added this
  });

  const [groupUsers, setGroupUsers] = useState([]);
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const docSnap = await getDoc(doc(db, "projects", projectId));
        const data = docSnap.data();
        setProjectCreatedAt(data.createdAt);
        setProjectEndDate(data.endDate);

        // ✅ Store workspaceId in formData
        setFormData((prev) => ({
          ...prev,
          workspaceId: data.workspaceId || "",
        }));
      } catch (error) {
        console.error("Error fetching project:", error);
        setErrorMsg("Failed to fetch project details.");
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const loadUsers = async () => {
      const q = query(collection(db, "users"), where("groupId", "==", user.groupId));
      const snapshot = await getDocs(q);
      const formatted = snapshot.docs.map((doc) => {
        const u = doc.data();
        if (u.role === "admin") return ;
        return {
          value: doc.id,
          label: u.name,
          avatarUrl: u.avatarUrl,
          isOnline: u.isOnline,
          isDisabled: u.role === "supervisor", // Disable if supervisor
        };
      }).filter(Boolean) //filter out any undefined values
      setGroupUsers(formatted);
    };
    loadUsers();
  }, [user.groupId]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedOption }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const assignedId = formData.assignedTo?.value;
      const due = new Date(formData.dueDate);

      if (projectCreatedAt && due < new Date(projectCreatedAt)) {
        setErrorMsg("❌ Due date cannot be before project start date.");
        setSubmitting(false);
        return;
      }
      if (projectEndDate && due > new Date(projectEndDate)) {
        setErrorMsg("❌ Due date cannot be after project end date.");
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        assignedTo: assignedId,
        assignedToName: formData.assignedTo?.label || "Unassigned",
        projectId,
        createdAt: new Date().toISOString(),
        doneClicked: false,
        wasRejected: false,
        completedLog: [],
        status: "pending",
      };

      await addDoc(collection(db, "tasks"), payload);

      if (assignedId) {
        await createNotifications({
          userId: assignedId,
          message: `You have a new task: '${formData.title}'`,
        });

        await updateUserStat(assignedId, "pendingCount", 1);
        await updateUserStat(assignedId, "totalAssignedTask", 1);
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Error creating task:", error);
      setErrorMsg("Something went wrong while creating the task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fdecea",
            color: "#b71c1c",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "1rem",
            border: "1px solid #f44336",
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <TaskForm
        isEdit={false}
        formData={formData}
        groupUsers={groupUsers}
        projectCreatedAt={projectCreatedAt}
        projectEndDate={projectEndDate}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
        onClose={onClose}
        submitting={submitting}
      />
    </>
  );
}
