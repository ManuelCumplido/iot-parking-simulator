// Lambda Function: iotShadowDeltaHandler
// Triggered by AWS IoT Core when a device shadow delta is generated.
// Used to react to differences between desired and reported states.

const { IoTDataPlaneClient, UpdateThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");

const iotData = new IoTDataPlaneClient({
  endpoint: process.env.IOT_ENDPOINT || process.env.AWS_IOT_ENDPOINT,
});

/**
 * Handles the shadow delta event from IoT Core.
 * The event payload includes the thing name and the "state" object containing
 * fields that are different between desired and reported.
 */
exports.handler = async (event) => {
  console.log("📩 Received shadow delta event:", JSON.stringify(event, null, 2));

  try {

    const thingName = event.thingName || event.topic?.split("/")[2];
    const deltaState = event.state;

    console.log(`ThingName: ${thingName}`);
    console.log("Delta state:", deltaState);

    const newReported = {
      state: { reported: deltaState },
    };

    const params = {
      thingName,
      payload: Buffer.from(JSON.stringify(newReported)),
    };

    await iotData.send(new UpdateThingShadowCommand(params));

    console.log(`Shadow updated for ${thingName}`);
    return {
      success: true,
      thingName,
      appliedState: deltaState,
    };
    
  } catch (error) {
    console.error("Error processing shadow delta:", error);
    throw error;
  }
};
