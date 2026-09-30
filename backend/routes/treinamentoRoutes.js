const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/treinamentoController");

const router = express.Router();

router.get("/trainings", auth(), ctrl.listPublished);
router.get("/trainings/:id", auth(), ctrl.getOne);
router.post("/trainings/:id/enroll", auth("collaborator"), ctrl.enroll);
router.get("/company/trainings", auth("company"), ctrl.listCompany);
router.post("/company/trainings", auth("company"), ctrl.create);
router.put("/company/trainings/:id", auth("company"), ctrl.update);
router.delete("/company/trainings/:id", auth("company"), ctrl.remove);

module.exports = router;
