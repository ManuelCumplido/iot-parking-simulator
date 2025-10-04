import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";

export const handler = async (event) => {
  console.log("Starting database initialization...");

  const secretsClient = new SecretsManagerClient();
  const secretArn = process.env.DB_SECRET_ARN || event.DBSecretARN;

  // Get DB credentials from Secrets Manager
  const secretData = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const secret = JSON.parse(secretData.SecretString);

  const dbConfig = {
    host: process.env.DB_HOST || event.DBHost,
    user: secret.username,
    password: secret.password,
    database: process.env.DB_NAME || event.DBName,
    port: 5432,
  };

  console.log("🔗 Connecting to database:", dbConfig.host);
  const client = new Client(dbConfig);
  await client.connect();

  console.log("🛠️ Running CREATE TABLE statements...");
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

  return { Status: "SUCCESS", Message: "Database initialized successfully" };
};
