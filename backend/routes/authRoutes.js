const express = require("express");
const { auth, login, register, me, updateMe, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.get("/me", auth(), me);
router.put("/me", auth(), updateMe);

module.exports = router;
