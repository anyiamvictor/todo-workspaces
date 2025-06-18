export async function createNotifications({ userId, message }) {
  try {
    // ✅ Check if user exists
    const userRes = await fetch(`http://localhost:3001/users/${userId}`);
    if (!userRes.ok) {
      console.warn(`Notification not created: User ${userId} not found.`);
      return;
    }

    // ✅ Create the notification
    await fetch(`http://localhost:3001/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        message,
        seen: false,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
