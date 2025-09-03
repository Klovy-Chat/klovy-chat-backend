import express from "express";
import InviteController from "../controllers/InviteController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/channel/:id/invite-link",
  AuthMiddleware,
  InviteController.createInvite,
);

router.get("/invite/:inviteId", InviteController.getInvite);

router.post(
  "/invite/:inviteId/accept",
  AuthMiddleware,
  InviteController.acceptInvite,
);

export default router;
