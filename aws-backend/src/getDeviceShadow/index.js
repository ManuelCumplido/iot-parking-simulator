// Lambda Function: getDeviceShadow
// Gets and validates the current IoT device shadow state and logs status changes in RDS

const { IoTDataPlaneClient, GetThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Client } = require("pg");

// Initialize the IoT client with the endpoint from environment variables
const iotData = new IoTDataPlaneClient({ endpoint: process.env.IOT_ENDPOINT });
// Initialize Secret Manager Client 
const secretsClient = new SecretsManagerClient();

/**
 * Triggered by AWS Step Functions as part of the parking simulation workflow.
 * This function retrieves the current IoT device shadow from AWS IoT Core and verifies 
 * whether the 'desired' state has been reflected in the 'reported' state.
 * 
 * It does NOT perform shadow updates — only validation.
 * 
 * The function stores a log entry in RDS indicating:
 * - the current reported status,
 * - whether synchronization has been achieved (synced / not_synced),
 * - and a timestamp.
 */

exports.handler = async (event) => {
  console.log("GetDeviceShadow input:", event);

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
    const { slotId } = event;
    let reported
    let isSynced

    if (slotId !== "FAIL_TEST") {

      // Fetch the latest device shadow document from AWS IoT Core
      const data = await iotData.send(new GetThingShadowCommand({ thingName: slotId }));

      // Parse the shadow payload into a JSON object
      const shadow = JSON.parse(Buffer.from(data.payload).toString());
      console.log("Shadow content:", JSON.stringify(shadow, null, 2));

      // Extract desired and reported values for validation
      const desired = shadow.state?.desired?.status;
      reported = shadow.state?.reported?.status;
      isSynced = desired === reported;

      console.log(`Shadow sync status for ${slotId}: desired=${desired}, reported=${reported}, isSynced=${isSynced}`);
    } else {
      isSynced = false;
      reported = "FAIL_TEST";
      console.log(`Shadow sync status for ${slotId}: isSynced=${isSynced}`);
    }

    const shadow_status = isSynced ? "synced" : "not_synced"

    const timestamp = new Date().toISOString();
    const query =
      `INSERT INTO parking_logs (slot_id, status, timestamp, shadow_status)
        VALUES ($1, $2, $3, $4)`;

    await client.query(query, [slotId, reported, timestamp, shadow_status]);
    console.log(`Saved in RDS: ${slotId} -> ${reported} at ${timestamp}`);

    // Return the relevant state information
    return { slotId, isSynced };

  } catch (error) {
    console.error("GetDeviceShadow error:", error);
    return { isSynced: false };
  } finally {
    await client.end();
  }
};

// Get database credentials from AWS Secrets Manager
async function getDbCredentials(secretArn) {
  const data = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
  return JSON.parse(data.SecretString);
}
