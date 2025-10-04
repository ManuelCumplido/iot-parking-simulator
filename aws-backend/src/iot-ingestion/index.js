const { Client } = require("pg");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secretName = process.env.DB_SECRET;
const dbName = process.env.DB_NAME;

const secretsClient = new SecretsManagerClient({});

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const data = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    const creds = JSON.parse(data.SecretString);

    const client = new Client({
      host: process.env.DB_HOST,
      port: 5432,
      user: creds.username,
      password: creds.password,
      database: dbName
    });

    await client.connect();

    const payload = JSON.parse(event.message || "{}");
    const query = `
      INSERT INTO parking_slots(slot_id, status, last_update)
      VALUES($1, $2, $3)
      ON CONFLICT (slot_id)
      DO UPDATE SET status = EXCLUDED.status, last_update = EXCLUDED.last_update
    `;
    const values = [payload.slotId, payload.status, payload.timestamp];

    await client.query(query, values);

    console.log("Insert/Update successful:", values);
    await client.end();

    return { success: true, values };
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};
