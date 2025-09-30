# iot-parking-simulator

---
# 🚗 Smart Parking Simulator

A serverless IoT project that simulates a network of smart parking sensors using AWS IoT Core, WebSockets, SQS/SNS, and RDS (PostgreSQL).
It demonstrates real-time data ingestion, asynchronous processing, notifications, and data persistence in a fully serverless architecture.

---
# 📌 Project Overview

This project simulates parking spot sensors that periodically publish their status (free or occupied) to AWS IoT Core using MQTT.
The data is then processed by AWS Lambda, stored in Amazon RDS (PostgreSQL), and distributed through different channels:

- WebSockets → for real-time monitoring (logs/notifications).

- SNS → for alerting when rules are triggered (e.g., spot occupied too long).

- SQS → for asynchronous/batch processing of events (metrics, aggregates).

---
# 🏗️ Architecture

---
# ⚡ Features

- MQTT Simulation: multiple devices publishing free/occupied events.
- Data Persistence: events stored in Amazon RDS (PostgreSQL).
- Real-time Streaming: live logs/alerts via WebSockets (wscat or Postman).
- Notifications: SNS topic triggers (email/SMS).
- Asynchronous Processing: SQS queue for batch metrics/aggregation.
- Serverless Infrastructure: defined with AWS SAM and deployed via CI/CD.

---
# 🛠️ Tech Stack

- AWS Services: IoT Core, Lambda, RDS (Postgres), SQS, SNS, API Gateway (WebSocket), CloudWatch, IAM
- Infrastructure as Code: AWS SAM
- Languages: Node.js (Lambdas, Simulator), SQL (RDS schema & queries)
- Testing: Unit & Integration tests with Jest

--- 
# 📊 Example Event Payload

```json
{
  "spaceId": "space-12",
  "status": "free",
  "timestamp": "..."
}

```
# ✅ Use Cases

- Smart city solutions: managing parking lots in real-time.
- Industrial IoT scenarios: device telemetry with async processing.
- Educational/portfolio project: demonstrate end-to-end serverless IoT architecture.





