//totalsAssigned task in the db should be handled herer since me moved task and edit inot new cmponents


import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext/AuthContextFirebase";
import TaskForm from "./TaskForm";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { createNotifications } from "../createNotifications";

export default function AddTaskHandler({ projectId, onClose, onSuccess }) {
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
        projectId,
        createdAt: new Date().toISOString(),
        doneClicked: false,
        wasRejected: false,
        completedLog: [],
        status: "pending",
      };
  
      const taskRef = await addDoc(collection(db, "tasks"), payload);
  
      if (assignedId) {
        await createNotifications({
          userId: assignedId,
          message: `You have a new task: '${formData.title}'`,
        });
  
        const userRef = doc(db, "users", assignedId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const current = userSnap.data().pendingCount || 0;
          await updateDoc(userRef, { pendingCount: current + 1 });
        }
      }
  
      onSuccess();
    } catch (error) {
      console.error("❌ Error creating task:", error);
      alert("Something went wrong while creating the task.");
    } finally {
      setSubmitting(false);
    }
  };
  
  

  return (
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
  );
}
