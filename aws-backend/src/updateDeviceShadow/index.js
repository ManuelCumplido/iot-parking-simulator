// Lambda Function: UpdateDeviceShadow
// Updates the 'desired' state of an IoT device shadow

import { IoTDataPlaneClient, UpdateThingShadowCommand } from "@aws-sdk/client-iot-data-plane";
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT }); //Initialize the IoT client with the endpoint



/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * Updates the 'desired' section of the device shadow to simulate a parking slot status change.
 */
export const handler = async (event) => {
    console.log("UpdateDeviceShadow input:", event);

    const { slotId, status } = event;
    // Define the new desired state payload for the device shadow
    const payload = {
        state: { desired: { occupied: status } }
    };

    const params = {
        thingName: slotId,
        payload: Buffer.from(JSON.stringify(payload))
    };

    try {
        // Send the update request to AWS IoT Core
        await iotData.send(new UpdateThingShadowCommand(params));
        console.log(`Desired state updated for ${slotId}: ${status}`);

        return { slotId, status, message: "Desired state updated" };
        
    } catch (error) {
        console.error("UpdateDeviceShadow error:", error);
        throw error;
    }
};
