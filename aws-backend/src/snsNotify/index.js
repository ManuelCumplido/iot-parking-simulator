const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient();

exports.handler = async (event) => {
  console.log("SNSNotify input:", JSON.stringify(event));

  try {
    const topicArn = process.env.SNS_TOPIC_ARN;

    const notification = {
      timestamp: new Date().toISOString(),
      slotId: event.slotId || "UnknownSlot",
      message: event.message ?? null
    };

    console.log("Publishing SNS notification:", notification);

    const message = `Parking Simulator Notification

A device synchronization issue has been detected in the IoT Parking Simulation.

Details:
- Slot ID: ${notification.slotId}
- Timestamp: ${notification.timestamp}

Message:
${notification.message}

This notification was generated automatically by the Parking Simulation workflow.
Please review the device shadow status and take action if necessary.
`

    const params = new PublishCommand({
      TopicArn: topicArn,
      Subject: `Parking Simulator – Device Sync Issue (${notification.slotId})`,
      Message: message,
    });

    await sns.send(params);

    return {
      success: true
    };

  } catch (error) {
    console.error("SNS Notify Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};
