const express = require("express");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const { Student } = require("../db");

const studentmiddleware = async (req, res, next) => {
    console.log("Middleware triggered");

    const authHeader = req.headers.authorization;

    // Check if the authorization header is provided
    if (!authHeader) {
        return res.status(403).json({ message: "Authorization header is missing" });
    }

    // Extract the token from the authorization header
    const token = authHeader.split(" ")[1]; // Assuming format "Bearer <token>"
    
    if (!token) {
        return res.status(403).json({ message: "Token is missing" });
    }

    try {
        // Verify the token
        const decodedValue = jwt.verify(token, JWT_SECRET);
        
        if (decodedValue) {
            req.studentId = decodedValue.studentId;
            const student = await Student.findOne({ _id: req.studentId });
            
            if (student) {
                next();
            } else {
                return res.status(403).json({ message: "Unauthorized user access" });
            }
        }
    } catch (error) {
        // Handle any errors during token verification
        console.error("Token verification error:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = studentmiddleware;
