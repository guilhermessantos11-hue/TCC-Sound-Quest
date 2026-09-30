const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/moduloController");

const router = express.Router();

router.post("/company/trainings/:id/modules", auth("company"), ctrl.createModule);
router.put("/company/modules/:id", auth("company"), ctrl.updateModule);
router.delete("/company/modules/:id", auth("company"), ctrl.removeModule);
router.post("/company/modules/:id/contents", auth("company"), ctrl.createContent);
router.put("/company/contents/:id", auth("company"), ctrl.updateContent);
router.delete("/company/contents/:id", auth("company"), ctrl.removeContent);
router.post("/contents/:id/complete", auth("collaborator"), ctrl.completeContent);

module.exports = router;
