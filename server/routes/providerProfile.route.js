import express from "express";
import { becomeProvider,getAllProviders,getProviderProfileById,updateProviderProfile ,getProviderDashboardStats} from "../controllers/providerProfile.controller.js";
import  {isProvider, protect}  from "../middlewares/user.middleware.js"; // Assuming this is your auth middleware
import upload from "../middlewares/multer.js";
 // The path to your multer config file

const providerProfileRouter = express.Router();

// --- Route to Become a Provider ---
// This route is protected, meaning the user must be logged in.
// It uses 'upload.array()' to accept multiple files from a field named 'portfolioImages'.
// We've set a limit of 10 images here, but you can change it.
providerProfileRouter.post(
    "/become-provider",
    protect,
    upload.array("portfolioImages", 10), 
    becomeProvider
);

providerProfileRouter.put(
    "/update-provider-profile",
    protect,
    upload.array("portfolioImages", 10), // User can upload new images to this same field
    updateProviderProfile
);

providerProfileRouter.get(
    "/get-all-providers",
    getAllProviders
);

providerProfileRouter.get(
    "/get-provider/:id",
    getProviderProfileById
);

providerProfileRouter.get(
    "/provider-dashboard-stats",
    protect,
    isProvider,
    getProviderDashboardStats
);

export default providerProfileRouter;