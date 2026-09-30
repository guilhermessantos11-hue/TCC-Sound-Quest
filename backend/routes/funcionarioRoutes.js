const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/funcionarioController");

const router = express.Router();

router.get("/collaborator/dashboard", auth("collaborator"), ctrl.dashboard);
router.get("/company/dashboard", auth("company"), ctrl.companyDashboard);
router.get("/company/collaborators", auth("company"), ctrl.list);
router.post("/company/collaborators", auth("company"), ctrl.create);
router.put("/company/collaborators/:id", auth("company"), ctrl.update);
router.delete("/company/collaborators/:id", auth("company"), ctrl.remove);
router.get("/company/progress", auth("company"), ctrl.progress);
router.get("/company/reports", auth("company"), ctrl.reports);

module.exports = router;
