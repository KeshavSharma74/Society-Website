import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Helper function to generate a token and set the cookie.
const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// --- Helper Function to Upload to Cloudinary ---
/**
 * A helper function to upload a buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer from req.file
 * @returns {Promise<string>} - A promise that resolves with the secure URL
 */
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "profile_images" }, // Organize uploads in a "profile_images" folder
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const register = async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;
    try {
        if (!name || !email || !password || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password should be at least 8 characters"
            });
        }

        const isPresent = await User.findOne({ email });
        if (isPresent) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber
        });

        generateToken(user._id, res);
        user.password = undefined;

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });
    } catch (error) {
        console.log("Error while registering the User", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email is not registered" });
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if (!isCorrectPassword) {
            return res.status(401).json({ success: false, message: "Email or Password is incorrect" });
        }

        generateToken(user._id, res);
        user.password = undefined;

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user
        });
    } catch (error) {
        console.log("Error while logging in the user", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            httpOnly: true,
            expires: new Date(0)
        });
        res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (error) {
        console.log("Error during logout:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const checkAuth = (req, res) => {
    const user = req.user; // This comes from your authentication middleware
    try {
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                user: null
            });
        }
        return res.status(200).json({
            success: true,
            message: "User is authenticated",
            user
        });
    } catch (error) {
        console.log("Error in checkAuth:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// --- Controller to Update User Profile ---
const updateUserProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        const userId = req.user._id; // From your auth middleware

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update text fields if they were provided
        if (name) user.name = name;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        // Check for and upload new profile image
        // req.file comes from multer's upload.single('profileImage')
        if (req.file) {
            const imageUrl = await uploadBufferToCloudinary(req.file.buffer);
            user.profileImage = imageUrl;
        }

        // Save all changes to the database
        const updatedUser = await user.save();

        updatedUser.password = undefined; // Don't send password back

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.log("Error in updateUserProfile:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

// --- Single Export Block ---
export { register, login, logout, checkAuth, updateUserProfile };