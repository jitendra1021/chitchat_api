import appUtils from "../utils/appUtils.js";
import admin from "../utils/firebase.js";

const sendNotifHandler = async (req, res, next) => {
  try {
    // const topic = req.body?.topic ?? "all-devices"; // Default to "all-devices" topic

    const message = {
      topic: "all-devices",
      notification: {
        title: "Global Test Notification",
        body: "This is for all connected devices",
      },
      data: {
        extraInfo: "Optional data payload",
      },
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({ success: true, message: "Notification sent to all devices" });

  } catch (error) {
    console.error("Error sending topic notification:", error);
    return next(appUtils.handleError(`Failed to send notification: ${error?.message}`, 500));
  }
};

export { sendNotifHandler };