const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/tarefaController");

const router = express.Router();

router.get("/company/tasks", auth("company"), ctrl.listCompany);
router.get("/company/tasks/:id", auth("company"), ctrl.getOne);
router.post("/company/tasks", auth("company"), ctrl.create);
router.put("/company/tasks/:id", auth("company"), ctrl.update);
router.delete("/company/tasks/:id", auth("company"), ctrl.remove);
router.post("/company/trainings/:id/tasks/generate", auth("company"), ctrl.generate);
router.post("/company/tasks/:id/review", auth("company"), ctrl.review);

router.get("/collaborator/tasks", auth("collaborator"), ctrl.listMine);
router.post("/tasks/:id/submit", auth("collaborator"), ctrl.submit);

module.exports = router;
