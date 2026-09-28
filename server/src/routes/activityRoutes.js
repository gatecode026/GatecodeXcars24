import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getActivities } from "../controllers/activityController.js";
import { getTLWhatsAppNumbers, setTLWhatsAppNumbers } from "../services/whatsappNotificationService.js";

const router = express.Router();

router.get("/", protect, getActivities);

router.get("/tl-whatsapp-numbers", protect, (req, res) => {
  return res.status(200).json({ numbers: getTLWhatsAppNumbers() });
});

router.post("/tl-whatsapp-numbers", protect, (req, res) => {
  const { numbers } = req.body;
  const updated = setTLWhatsAppNumbers(numbers || []);
  return res.status(200).json({
    message: "TL WhatsApp notification numbers updated successfully",
    numbers: updated
  });
});

export default router;
