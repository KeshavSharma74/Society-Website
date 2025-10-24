import express from 'express';
import { 
    checkAuth, 
    login, 
    logout, 
    register, 
    updateUserProfile 
} from '../controllers/user.controller.js'; // Remove admin controllers
import { protect } from '../middlewares/user.middleware.js'; // Remove isAdmin
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/logout', logout);
userRouter.get('/check-auth', protect, checkAuth);

// This is correct
userRouter.put(
    "/update-profile", 
    protect, 
    upload.single("profileImage"), 
    updateUserProfile
);

// ADMIN ROUTES REMOVED FROM HERE

export default userRouter;