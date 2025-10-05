const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { Client } = require("pg");
const https = require("https");
const url = require("url");

function sendResponseSafe(event, context, status, reason) {
  try {
    const responseBody = JSON.stringify({
      Status: status,
      Reason: reason || "Database initialization complete",
      PhysicalResourceId: context?.logStreamName || "unknown",
      StackId: event?.StackId,
      RequestId: event?.RequestId,
      LogicalResourceId: event?.LogicalResourceId,
    });

    console.log("Sending response to CloudFormation:", responseBody);

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: "PUT",
      headers: {
        "Content-Type": "",
        "Content-Length": Buffer.byteLength(responseBody),
      },
    };

    const req = https.request(options, (res) => {
      console.log(`CloudFormation response status: ${res.statusCode}`);
    });

    req.on("error", (err) => console.error("sendResponseSafe error:", err));
    req.write(responseBody);
    req.end();
  } catch (e) {
    console.error("Fatal: could not send response to CloudFormation:", e);
  }
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  if (global._event && global._context) {
    sendResponseSafe(global._event, global._context, "FAILED", err.message);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  if (global._event && global._context) {
    sendResponseSafe(global._event, global._context, "FAILED", reason?.message || "Unhandled rejection");
  }
});


exports.handler = async (event, context) => {
  console.log("Starting database initialization...");
  console.log("Event:", JSON.stringify(event, null, 2));

  // Guardar referencias globales (para el catch global)
  global._event = event;
  global._context = context;

  try {
    const secretsClient = new SecretsManagerClient();
    const secretArn = process.env.DB_SECRET_ARN || event.DBSecretARN;

    console.log("Fetching secret from Secrets Manager:", secretArn);
    const secretData = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
    const secret = JSON.parse(secretData.SecretString);

    const dbConfig = {
      host: process.env.DB_HOST || event.DBHost,
      user: secret.username,
      password: secret.password,
      database: process.env.DB_NAME || event.DBName,
      port: 5432,
    };

    console.log("Connecting to database:", dbConfig.host);
    const client = new Client(dbConfig);
    await client.connect();

    console.log("Running CREATE TABLE statements...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        slot_number INT NOT NULL,
        is_occupied BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        license_plate VARCHAR(10) UNIQUE NOT NULL,
        entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        exit_time TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sensors (
        id SERIAL PRIMARY KEY,
        sensor_id VARCHAR(50) NOT NULL,
        slot_id INT REFERENCES parking_slots(id),
        battery_level INT,
        last_signal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created or already exist.");
    await client.end();

    sendResponseSafe(event, context, "SUCCESS", "Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
    sendResponseSafe(event, context, "FAILED", err.message);
  }
};
