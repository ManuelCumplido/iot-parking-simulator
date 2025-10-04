exports.handler = async (event) => {
  console.log("📥 Incoming IoT Event:", JSON.stringify(event, null, 2));

  const payload = event;

  return { statusCode: 200 };
};
