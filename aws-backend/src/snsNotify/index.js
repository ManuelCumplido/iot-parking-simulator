const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient();

exports.handler = async (event) => {
  console.log("SNSNotify input:", JSON.stringify(event));

  try {
    const topicArn = process.env.SNS_TOPIC_ARN;

    const notification = {
      timestamp: new Date().toISOString(),
      slotId: event.slotId || "UnknownSlot",
      deviceId: event.deviceId || "UnknownDevice",
      message: event.message ?? null
    };

    console.log("Publishing SNS notification:", notification);

    const params = new PublishCommand({
      TopicArn: topicArn,
      Subject: `Parking Simulator – Device Sync Issue (${notification.deviceId})`,
      Message: JSON.stringify(notification, null, 2),
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
