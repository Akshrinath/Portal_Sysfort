"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post("/login", authController_1.loginUser);
// router.post("/login", (req, res, next) => {
//   console.log("Route /login called");
//   next();
// }, loginUser);
router.get("/profile", authController_1.authenticateJWT, (req, res) => {
    res.json({ message: "Protected profile", user: req.user });
});
exports.default = router;
