const express = require("express");
const { auth } = require("../controllers/authController");
const ctrl = require("../controllers/certificadoController");

const router = express.Router();

router.get("/certificates", auth(), ctrl.list);
router.get("/certificates/:id", auth(), ctrl.getOne);

module.exports = router;
