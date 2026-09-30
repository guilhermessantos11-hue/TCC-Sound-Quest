const express = require("express");
const { auth, login, register, me, updateMe } = require("../controllers/authController");

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/register", register);
router.get("/me", auth(), me);
router.put("/me", auth(), updateMe);

module.exports = router;
