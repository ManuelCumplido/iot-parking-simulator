// Lambda Function: getDeviceShadow
// Get and validates the current IoT device shadow state

import { IoTDataPlaneClient, GetThingShadowCommand } from "@aws-sdk/client-iot-data-plane";
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT }); //Initialize the IoT client with the endpoint

/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * Retrieves the IoT device shadow and compares the 'desired' and 'reported' states
 * to verify synchronization between the cloud and the physical device.
 */
export const handler = async (event) => {
  console.log("GetShadow input:", event);

  try {
    const { slotId } = event;
    // Fetch the latest device shadow document from AWS IoT Core
    const data = await iotData.send(new GetThingShadowCommand({ thingName: slotId }));
    const shadow = JSON.parse(Buffer.from(data.payload).toString());
    console.log("Shadow content:", JSON.stringify(shadow, null, 2));

    // Extract desired and reported values for validation
    const desired = shadow.state?.desired?.occupied;
    const reported = shadow.state?.reported?.occupied;
    const isSynced = desired === reported;

    return { slotId, isSynced, desired, reported, state: shadow.state };
  } catch (error) {
    console.error("GetShadow error:", error);
    throw error;
  }
};
