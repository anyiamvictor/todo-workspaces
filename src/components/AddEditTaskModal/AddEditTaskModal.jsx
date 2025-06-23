import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import TaskForm from "./TaskForm";
import { createNotifications } from "../createNotifications";

export default function AddEditTaskModal({ projectId, task, onClose, onSuccess }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assignedTo: task?.assignedTo
      ? { value: task.assignedTo, label: task.assignedToName || "Unassigned" }
      : null,
    dueDate: task?.dueDate || "",
    status: task?.status || "pending",
    priority: task?.priority || "medium",
  });

  const [groupUsers, setGroupUsers] = useState([]);
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      const projectRef = doc(db, "projects", projectId);
      const snap = await getDoc(projectRef);
      const data = snap.data();
      setProjectCreatedAt(data.createdAt);
      setProjectEndDate(data.endDate);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const loadUsers = async () => {
      const q = query(collection(db, "users"), where("groupId", "==", user.groupId));
      const snapshot = await getDocs(q);
      const formatted = snapshot.docs.map((doc) => {
        const u = doc.data();
        return {
          value: doc.id,
          label: u.name,
          avatarUrl: u.avatarUrl,
          isOnline: u.isOnline,
        };
      });
      setGroupUsers(formatted);
    };
    loadUsers();
  }, [user.groupId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedOption }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignedId = formData.assignedTo?.value || null;
    const due = new Date(formData.dueDate);

    if (projectCreatedAt && due < new Date(projectCreatedAt)) {
      alert("❌ Due date cannot be before project start date.");
      return;
    }
    if (projectEndDate && due > new Date(projectEndDate)) {
      alert("❌ Due date cannot be after project end date.");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      assignedTo: assignedId,
      assignedToName: formData.assignedTo?.label || "Unassigned",
      dueDate: formData.dueDate,
      status: formData.status,
      priority: formData.priority,
      projectId,
    };

    try {
      if (task) {
        // Edit
        const ref = doc(db, "tasks", task.id);
        await updateDoc(ref, payload);
      } else {
        // Create
        await addDoc(collection(db, "tasks"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });

        if (assignedId) {
          await createNotifications({
            userId: assignedId,
            message: `You have a new task: '${formData.title}'`,
          });
        }
      }

      onSuccess();
    } catch (err) {
      console.error("Error saving task:", err);
      alert("Something went wrong while saving the task.");
    }
  };

  return (
    <TaskForm
      isEdit={!!task}
      formData={formData}
      groupUsers={groupUsers}
      projectCreatedAt={projectCreatedAt}
      projectEndDate={projectEndDate}
      handleChange={handleChange}
      handleSelectChange={handleSelectChange}
      handleSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
