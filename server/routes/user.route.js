import express from 'express';
import { checkAuth, getAdminDashboardStats, getAllBookings, login, logout, register, updateUserProfile } from '../controllers/user.controller.js';
import  {isAdmin, protect}  from '../middlewares/user.middleware.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/register',register );
userRouter.post('/login', login );
userRouter.post('/logout', logout );
userRouter.get('/check-auth',protect,checkAuth );
userRouter.get('/admin-dashboard-stats', protect, isAdmin,getAdminDashboardStats );
userRouter.get('/get-all-bookings', protect, isAdmin,getAllBookings );

// --- NEW: Route to Update User Profile ---
// This route is protected and uses upload.single()
// It expects the file to be in a field named 'profileImage'
userRouter.put(
    "/update-profile", 
    protect, 
    upload.single("profileImage"), 
    updateUserProfile
);


export default userRouter;