// snsNotify.js
exports.handler = async (event) => {
  console.log("SNSNotify input:", event);

  const slotId = event.slotId || "UnknownSlot";
  const message = event.message || "Simulation completed";

  console.log(`Notification → Slot: ${slotId}, Message: ${message}`);

    return { success: true };
};