import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import TaskForm from "./TaskForm";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { createNotifications } from "../createNotifications";
import { updateUserStat } from "../StatHandler/";

export default function EditTaskHandler({ projectId, task, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: null,
    dueDate: "",
    status: "pending",
    priority: "medium",
  });

  const [groupUsers, setGroupUsers] = useState([]);
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const fetchProject = async () => {
      const docSnap = await getDoc(doc(db, "projects", projectId));
      const data = docSnap.data();
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

  useEffect(() => {
    if (task) {
      const matchedUser = groupUsers.find((u) => u.value === task.assignedTo);
      setFormData({
        ...task,
        assignedTo: matchedUser || {
          value: task.assignedTo,
          label: task.assignedToName || "",
          avatarUrl: "",
          isOnline: false,
        },
      });
    }
  }, [task, groupUsers]);

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

    const assignedId = formData.assignedTo?.value || "";
    const prevAssignedId = task.assignedTo;
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
      ...formData,
      assignedTo: assignedId,
      assignedToName: formData.assignedTo?.label || "Unassigned",
    };

    try {
      await updateDoc(doc(db, "tasks", task.id), payload);

      if (assignedId !== prevAssignedId) {

         // Update user stats
  await updateUserStat(prevAssignedId, "pendingCount", -1);
        await updateUserStat(assignedId, "pendingCount", 1);
        
        // notifications
        if (assignedId) {
          await createNotifications({
            userId: assignedId,
            message: `You have been assigned a new task: '${formData.title}'`,
          });
        }
        if (prevAssignedId) {
          await createNotifications({
            userId: prevAssignedId,
            message: `Your task '${formData.title}' has been reassigned to someone else.`,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TaskForm
      isEdit={true}
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
  );
}
