import express from "express";
import {
    becomeProvider,
    updateProviderProfile,
    addServiceOffering,      // <-- NEW
    deleteServiceOffering,     // <-- NEW
    getAllProviders,
    getProviderById,
    getProviderDashboardStats  // <-- You had this, but it needs to be imported
} from "../controllers/providerProfile.controller.js";
import { protect, isProvider } from "../middlewares/user.middleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// --- Public Routes ---
router.get("/", getAllProviders);
router.get("/:id", getProviderById); // Renamed from "/get-provider/:id" for simplicity

// --- Private Provider Routes ---
router.post(
    "/become-provider",
    protect,
    becomeProvider // Does NOT upload images anymore
);

router.put(
    "/", // Renamed from "/update-provider-profile"
    protect,
    isProvider,
    updateProviderProfile // Does NOT upload images anymore
);

// --- Routes for Managing Services ---
router.post(
    "/service",
    protect,
    isProvider,
    upload.array("portfolioImages", 10), // Images are for the SERVICE
    addServiceOffering
);

router.delete(
    "/service/:serviceId",
    protect,
    isProvider,
    deleteServiceOffering
);

// --- Provider Dashboard Route ---
router.get(
    "/dashboard/stats", // Changed path to be more clear
    protect,
    isProvider,
    getProviderDashboardStats
);

export default router;