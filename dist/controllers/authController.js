"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.checkSession = exports.authenticateJWT = exports.loginUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// -----------------------------
// Helper: Get JWT secret safely
// -----------------------------
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("❌ JWT_SECRET is not defined in environment variables");
    return secret;
};
// -----------------------------
// Login Controller
// -----------------------------
const loginUser = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    try {
        // Fetch user
        const [rows] = await db_1.db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        const user = rows[0];
        // ✅ For now using plain text password check (replace with bcrypt later)
        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        // Uncomment for bcrypt later
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if (!isPasswordValid) {
        //   return res.status(401).json({ message: "Invalid username or password" });
        // }
        // ✅ Create JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            email: user.email,
            fname: user.fname,
            lname: user.lname,
            department: user.department,
            contactno: user.contactno,
            posting_date: user.posting_date,
            user_type: user.user_type,
            update_user: user.update_user,
            is_active: user.is_active,
        }, getJwtSecret(), { expiresIn: "7d" });
        // ✅ Save session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fname: user.fname,
            lname: user.lname,
            department: user.department,
            contactno: user.contactno,
            posting_date: user.posting_date,
            user_type: user.user_type,
            update_user: user.update_user,
            is_active: user.is_active,
        };
        // Convert session expiry to IST for logging
        const utcExpire = req.session.cookie.expires;
        const localExpire = utcExpire
            ? new Date(utcExpire).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : null;
        console.log("✅ Session created:", {
            cookie: {
                path: req.session.cookie.path,
                expiresUTC: utcExpire,
                expiresLocal: localExpire,
                originalMaxAge: req.session.cookie.originalMaxAge,
                httpOnly: req.session.cookie.httpOnly,
                secure: req.session.cookie.secure,
            },
            user: req.session.user,
        });
        return res.json({
            message: "Login successful",
            token,
            session: {
                user: req.session.user,
                expiresUTC: utcExpire,
                expiresLocal: localExpire,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.loginUser = loginUser;
// -----------------------------
// Middleware to protect routes using JWT
// -----------------------------
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Token missing" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.authenticateJWT = authenticateJWT;
// -----------------------------
// Session Check (for debugging)
// -----------------------------
const checkSession = (req, res) => {
    if (req.session.user) {
        const utcExpire = req.session.cookie.expires;
        const localExpire = utcExpire
            ? new Date(utcExpire).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : null;
        return res.json({
            message: "✅ Session exists",
            user: req.session.user,
            expiresUTC: utcExpire,
            expiresLocal: localExpire,
        });
    }
    else {
        return res.status(401).json({ message: "❌ No session found" });
    }
};
exports.checkSession = checkSession;
// -----------------------------
// Logout Controller
// -----------------------------
const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid"); // clear cookie
        return res.json({ message: "Logged out successfully" });
    });
};
exports.logoutUser = logoutUser;
