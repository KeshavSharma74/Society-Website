import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/user.model.js";

const protect = async (req, res, next) => {
    const token = req.cookies.jwt;
    
    try {
        if (!token) {
            return res.status(401).json({ // Use 401 Unauthorized status
                success: false,
                message: "Please login first to continue"
            });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedToken) {
            return res.status(401).json({ // Use 401 Unauthorized status
                success: false,
                message: "Unauthorized - Invalid token."
            });
        }

        const user = await User.findById(decodedToken.userId).select("-password");

        if (!user) {
            return res.status(404).json({ // Use 404 Not Found status
                success: false,
                message: "User not found."
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Error in protect middleware:", error.message);
        return res.status(401).json({
            success: false,
            message: "Unauthorized. " + error.message
        });
    }
};

const isAdmin = (req, res, next) => {
    const user = req.user; // This runs AFTER protect, so req.user exists
    try {
        if (user.role !== "admin") {
            return res.status(403).json({ // Use 403 Forbidden status
                success: false,
                message: "Unauthorized. Admin access required."
            });
        }
        next();
    }
    catch (error) {
        console.log("Error in isAdmin middleware:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const isProvider = (req, res, next) => {
    const user = req.user;
    try {
        if (user.role !== "provider") {
            return res.status(403).json({ // Use 403 Forbidden status
                success: false,
                message: "Unauthorized. Provider access required."
            });
        }
        next();
    }
    catch (error) {
        console.log("Error in isProvider middleware:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const isCustomer = (req, res, next) => {
    const user = req.user;
    try {
        if (user.role !== "customer") {
            return res.status(403).json({ // Use 403 Forbidden status
                success: false,
                message: "Unauthorized. Customer access required."
            });
        }
        next();
    }
    catch (error) {
        console.log("Error in isCustomer middleware:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Export all middleware functions
export { protect, isAdmin, isProvider, isCustomer };