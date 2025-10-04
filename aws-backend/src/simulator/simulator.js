const mqtt = require('mqtt');
const fs = require('fs');

const client = mqtt.connect('mqtts://a32j14dxvrqa8a-ats.iot.us-east-1.amazonaws.com', {
  clientId: 'ParkingSensor01',
  key: fs.readFileSync('./src/simulator/certs/private.pem.key'),
  cert: fs.readFileSync('./src/simulator/certs/certificate.pem.crt'),
  ca: fs.readFileSync('./src/simulator/certs/AmazonRootCA1.pem')
});

client.on('connect', () => {
  console.log("✅ Connected as ParkingSensor01");
  setInterval(() => {
    const status = Math.random() > 0.5 ? "occupied" : "free";
    const payload = { spaceId: "1", status, ts: Date.now() };
    client.publish('parking/1/status', JSON.stringify(payload));
    console.log("Published:", payload);
  }, 5000);
});
