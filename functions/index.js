import { initializeApp } from "firebase-admin/app";
initializeApp(); // ✅ Called only once here

export { assignRole } from "./assignRole.js";
export { deleteUserCompletely } from "./deleteUserCompletely.js";
export { deleteGroupCompletely } from "./deleteGroupCompletely.js";
