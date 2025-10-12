// Lambda Function: getDeviceShadow
// Gets and validates the current IoT device shadow state

const { IoTDataPlaneClient, GetThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");

// Initialize the IoT client with the endpoint from environment variables
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT });

/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * Retrieves the IoT device shadow and compares the 'desired' and 'reported' states
 * to verify synchronization between the cloud and the physical device.
 */
exports.handler = async (event) => {
  console.log("GetDeviceShadow input:", event);

  try {
    const { slotId } = event;

    // Fetch the latest device shadow document from AWS IoT Core
    const data = await iotData.send(new GetThingShadowCommand({ thingName: slotId }));

    // Parse the shadow payload into a JSON object
    const shadow = JSON.parse(Buffer.from(data.payload).toString());
    console.log("Shadow content:", JSON.stringify(shadow, null, 2));

    // Extract desired and reported values for validation
    const desired = shadow.state?.desired?.occupied;
    const reported = shadow.state?.reported?.occupied;
    const isSynced = desired === reported;

    console.log(`Shadow sync status for ${slotId}: desired=${desired}, reported=${reported}, isSynced=${isSynced}`);

    // Return the relevant state information
    return { isSynced };

  } catch (error) {
    console.error("GetDeviceShadow error:", error);
    return { isSynced: false };
  }
};
