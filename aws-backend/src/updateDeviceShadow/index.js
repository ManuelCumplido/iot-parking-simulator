// Lambda Function: UpdateDeviceShadow
// Updates the 'desired' state of an IoT device shadow and logs status changes in RDS

const { IoTDataPlaneClient, UpdateThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Client } = require("pg");

// Initialize the IoT client with the endpoint from environment variables
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT });
// Initialize Secret Manager Client 
const secretsClient = new SecretsManagerClient();



/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * Updates the 'desired' section of the device shadow to simulate a parking slot status change.
 * Populate logs status changes in RDS table
 */
exports.handler = async (event) => {
  console.log("UpdateDeviceShadow input:", event);

  const secretArn = process.env.DB_SECRET_ARN;
  const dbName = process.env.DB_NAME;

  const credentials = await getDbCredentials(secretArn);

  const client = new Client({
    host: process.env.DB_HOST,
    user: credentials.username,
    password: credentials.password,
    database: dbName,
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const record of event.Records) {
      const { slotId, status } = JSON.parse(record.body);

      // Simulate failure for testing DLQ
      if (slotId === "FAIL_TEST") {
        console.log("Forcing an error for DLQ test...");
        throw new Error("Simulated failure for DLQ test");
      }

      const params = {
        thingName: slotId,
        payload: Buffer.from(JSON.stringify({
          state: { desired: { status } }
        }))
      };

      await iotData.send(new UpdateThingShadowCommand(params));
      console.log(`Desired state updated for ${slotId}: ${status}`);

      const timestamp = new Date().toISOString();
      const query = 
        `INSERT INTO parking_events (slot_id, status, timestamp)
        VALUES ($1, $2, $3)`;

      await client.query(query, [slotId, status, timestamp]);
      console.log(`Saved in RDS: ${slotId} -> ${status} at ${timestamp}`);

    }
  } catch (error) {
    console.error("UpdateDeviceShadow error:", error);
    throw error;
  } finally {
    await client.end();
  }

  return { message: "All records processed successfully" };

};

// Get database credentials from AWS Secrets Manager
async function getDbCredentials(secretArn) {
  const data = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
  return JSON.parse(data.SecretString);
}
