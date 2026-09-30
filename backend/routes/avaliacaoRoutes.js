const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/avaliacaoController");

const router = express.Router();

router.post("/activities/:id/submit", auth("collaborator"), ctrl.submit);
router.get("/collaborator/attempts", auth("collaborator"), ctrl.myAttempts);
router.post("/company/trainings/:id/activity", auth("company"), ctrl.saveActivity);
router.get("/company/attempts", auth("company"), ctrl.attempts);

module.exports = router;
