import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './EditProfileModal.module.css';
import {
  doc,
  updateDoc,
  getDoc,
  increment
} from 'firebase/firestore';
import { db, storage } from '../../components/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { formatDistanceToNow } from 'date-fns';

const EditProfileModal = ({ user, onClose, onUpdated }) => {
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxFileSizeMB = 1;
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 500,
      useWebWorker: true,
    };

    try {
      if (file.size / 1024 / 1024 > maxFileSizeMB * 3) {
        alert('Image too large. Please choose a file under 3MB.');
        return;
      }

      const compressedFile = await imageCompression(file, options);
      setAvatarFile(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Compression failed:', error);
    }
  };

  const handleSave = async () => {
    setUploading(true);
    let avatarUrl = user.avatarUrl;

    try {
      const userRef = doc(db, 'users', user.uid);
      const groupRef = doc(db, 'groups', user.groupId);

      const [userSnap, groupSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(groupRef),
      ]);

      const userData = userSnap.exists() ? userSnap.data() : {};
      const groupData = groupSnap.exists() ? groupSnap.data() : {};

      const lastUpdated = userData.lastProfileUpdate?.toDate?.() || new Date(0);
      const now = new Date();
      const daysSince = (now - lastUpdated) / (1000 * 60 * 60 * 24);

      if (daysSince < 30) {
        setMessage(
          `You can only update your profile once every 30 days. Last updated ${formatDistanceToNow(lastUpdated)} ago.`
        );
        setIsError(true);
        setUploading(false);
        return;
      }

      const updateCount = groupData.monthlyProfileUpdateCount || 0;
      if (updateCount >= 15) {
        setMessage(
          'Too many members have updated their profile this month. Please try again next month.'
        );
        setIsError(true);
        setUploading(false);
        return;
      }

      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
      }

      await Promise.all([
        updateDoc(userRef, {
          name,
          bio,
          phoneNumber,
          avatarUrl,
          lastProfileUpdate: now,
        }),
        updateDoc(groupRef, {
          monthlyProfileUpdateCount: increment(1),
        }),
      ]);

      setMessage(
        '✅ Profile updated successfully. Limits are in place to stay within Firebase free tier.'
      );
      setIsError(false);

      setTimeout(() => {
        setMessage('');
        onUpdated();
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('❌ Failed to update profile.');
      setIsError(true);
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2>Edit Profile</h2>

        <div className={styles.avatarSection}>
          <img src={avatarPreview || '/default-avatar.png'} alt="Avatar" />
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {message && (
          <motion.div
            className={isError ? styles.errorMsg : styles.successMsg}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        <input
          type="text"
          placeholder="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <textarea
          placeholder="Your bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={uploading}>
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;

// a user first registers a company and by extenstion a group is created with an invite code. 
// thhe user is autmoatically give role===admin and status ==active. new members signup via form and google, 
// and enter the invite code their profile is created in the db but their status is inactive, and 
// their roole is member. the admin in his panel can see all members, choose who to activate, mkae supervisor deactivate
//  or unmake supervisor. supervisors can create projects and tasks, assign them to members, approve, reject and edit tasks.
//  when the do the counts in the members are updated accordingly. members can upadte their profile, 
// i think just for image, bio password and phone. admin can delte any task or project or workspace 
// but supervisors can only delete the project and by extenntion the tasks they created and not the ones created 
// by others.

// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {

//     // USERS COLLECTION
//     match /users/{userId} {
//       allow read: if request.auth != null && request.auth.uid == userId;

//       // Members can only update basic profile fields
//       allow update: if request.auth.uid == userId &&
//         isMember() &&
//         onlyUpdatingOwnProfileData();

//       // Supervisor can edit members in same group
//       allow update: if isSupervisor() && inSameGroup(userId);

//       // Admin can update/delete anyone
//       allow update, delete: if isAdmin();
//     }

//     // TASKS COLLECTION
//     match /tasks/{taskId} {
//       allow create: if request.auth != null && (
//         isSupervisor() || isAdmin()
//       );

//       allow update: if request.auth != null && (
//         // Group member marking task as completed
//         (inSameGroup(resource.data.assignedTo) && onlyMarkingCompleted()) ||

//         // Supervisor editing task in their group
//         (isSupervisor() && isTaskCreatorOrGroup(resource.data)) ||

//         // Admin access
//         isAdmin()
//       );

//       allow read: if request.auth != null;

//       // Supervisor can delete only tasks they created
//       allow delete: if isSupervisor() && isTaskCreator(resource.data);

//       // Admin can delete any task
//       allow delete: if isAdmin();
//     }

//     // PROJECTS COLLECTION
//     match /projects/{projectId} {
//       allow create: if request.auth != null && (
//         isSupervisor() || isAdmin()
//       );

//       allow read: if request.auth != null;

//       // Only creator of project or admin can update/delete
//       allow update, delete: if request.auth != null && (
//         (isSupervisor() && isProjectCreator(resource.data)) ||
//         isAdmin()
//       );
//     }

//     // WORKSPACES COLLECTION
//     match /workspaces/{workspaceId} {
//       allow read: if request.auth != null;

//       allow delete, update: if isAdmin();
//     }

//     // fallback deny all
//     match /{document=**} {
//       allow read, write: if false;
//     }
//   }

//   // 🔁 REUSABLE FUNCTIONS

//   function isAdmin() {
//     return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
//   }

//   function isSupervisor() {
//     return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "supervisor";
//   }

//   function isMember() {
//     return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "member";
//   }

//   function inSameGroup(targetUserId) {
//     let requester = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
//     let target = get(/databases/$(database)/documents/users/$(targetUserId)).data;
//     return requester.groupId == target.groupId;
//   }

//   function onlyUpdatingOwnProfileData() {
//     let allowed = ['bio', 'avatarUrl', 'password', 'phoneNumber', 'name'];
//     return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowed);
//   }

//   function onlyMarkingCompleted() {
//     let changed = request.resource.data.diff(resource.data).changedKeys();
//     return changed.hasOnly(['status']) && request.resource.data.status == 'completed';
//   }

//   function isTaskCreator(task) {
//     return task.createdBy == request.auth.uid;
//   }

//   function isProjectCreator(project) {
//     return project.createdBy == request.auth.uid;
//   }

//   function isTaskCreatorOrGroup(task) {
//     return isTaskCreator(task) || inSameGroup(task.assignedTo);
//   }
// }
