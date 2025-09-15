"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const db_1 = require("../config/db");
const getUsers = async (req, res) => {
    try {
        const [rows] = await db_1.db.query("SELECT id, fname, email FROM users"); // safe fields only
        res.json(rows);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getUsers = getUsers;
