import express from "express";
import { 
    getAdminDashboardStats, 
    getAllBookings 
} from "../controllers/admin.controller.js"; // Import from admin.controller.js
import { protect, isAdmin } from "../middlewares/user.middleware.js";

const router = express.Router();

router.get(
    "/dashboard-stats",
    protect,
    isAdmin, 
    getAdminDashboardStats
);

router.get(
    "/all-bookings",
    protect,
    isAdmin,
    getAllBookings
);

export default router;