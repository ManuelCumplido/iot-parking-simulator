// snsNotify.js
export const handler = async (event) => {
  console.log("SNSNotify input:", event);
  console.log(`Notification: ${event.slotId} → ${event.message || "Simulation completed"}`);
  return { success: true };
};
