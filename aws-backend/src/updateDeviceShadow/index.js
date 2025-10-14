// Lambda Function: UpdateDeviceShadow
// Updates the 'desired' state of an IoT device shadow

const { IoTDataPlaneClient, UpdateThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");

// Initialize the IoT client with the endpoint from environment variables
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT });

/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * Updates the 'desired' section of the device shadow to simulate a parking slot status change.
 */
exports.handler = async (event) => {
  console.log("UpdateDeviceShadow input:", event);

  try {
    for (const record of event.Records) {

      const { slotId, status } = JSON.parse(record.body);

      const params = {
        thingName: slotId,
        payload: Buffer.from(JSON.stringify({
          state: { desired: { status } }
        }))
      };

      await iotData.send(new UpdateThingShadowCommand(params));

      console.log(`Desired state updated for ${slotId}: ${status}`);
    }
  }catch (error) {
    console.error("UpdateDeviceShadow error:", error);
    throw error;
  }

  return { slotId, status, message: "Desired state updated" };

};
