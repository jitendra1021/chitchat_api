import express from "express";
import { sendNotifHandler } from "../controller/notifController.js";

const notifRouter = express.Router();

notifRouter.get('/', sendNotifHandler );

export default notifRouter