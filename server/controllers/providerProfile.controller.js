import User from "../models/user.model.js";
import ProviderProfile from "../models/providerProfile.model.js";
import cloudinary from "../config/cloudinary.js"; // Correct import of your cloudinary config
import streamifier from "streamifier"; // We need this small utility

/**
 * A helper function to upload a buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer from req.file
 * @returns {Promise<string>} - A promise that resolves with the secure URL
 */
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        // Create an upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "portfolio_images" }, // Optional: organize uploads in a folder
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );

        // Pipe the buffer to the stream
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const becomeProvider = async (req, res) => {
    try {
        const userId = req.user._id; // From your protectRoute middleware

        // 1. Get form data from the body
        const { bio, experience, serviceCategories } = req.body;

        // 2. Check for portfolio images (required by your model)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Portfolio images are required."
            });
        }

        // 3. Check if user is already a provider
        const existingProfile = await ProviderProfile.findOne({ user: userId });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: "You are already a provider."
            });
        }

        // 4. Upload all images to Cloudinary in parallel
        // We map each file to our new uploadBufferToCloudinary helper
        const uploadPromises = req.files.map(file => uploadBufferToCloudinary(file.buffer));
        
        // We wait for all promises to resolve
        const portfolioImageUrls = await Promise.all(uploadPromises);

        if (!portfolioImageUrls || portfolioImageUrls.length === 0) {
             return res.status(500).json({
                success: false,
                message: "Failed to upload images, please try again."
            });
        }

        // 5. Create the new ProviderProfile in the database
        const newProfile = await ProviderProfile.create({
            user: userId,
            bio,
            experience,
            serviceCategories,
            portfolioImages: portfolioImageUrls // Save the array of URLs
        });

        // 6. Update the User's role from 'customer' to 'provider'
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: "provider" },
            { new: true }
        ).select("-password"); // Send back the updated user (without password)

        return res.status(201).json({
            success: true,
            message: "Congratulations! You are now a provider.",
            user: updatedUser,
            profile: newProfile
        });

    } catch (error) {
        console.log("Error in becomeProvider controller:", error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
             return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const updateProviderProfile = async (req, res) => {
    try {
        const userId = req.user._id; // From your protectRoute middleware
        
        // 1. Find the provider profile
        const profile = await ProviderProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Provider profile not found."
            });
        }

        // 2. Get text data from the body
        const { bio, experience, serviceCategories } = req.body;

        // 3. Update text fields if they were provided
        if (bio) profile.bio = bio;
        if (experience) profile.experience = experience;
        
        // Note: For serviceCategories, you might want to replace the whole array
        // If serviceCategories is sent as an empty array, it will clear them.
        if (serviceCategories) {
            profile.serviceCategories = serviceCategories;
        }

        // 4. Check for and upload new images
        if (req.files && req.files.length > 0) {
            // Upload all new images to Cloudinary
            const uploadPromises = req.files.map(file => uploadBufferToCloudinary(file.buffer));
            const newImageUrls = await Promise.all(uploadPromises);

            // Add the new image URLs to the existing array
            profile.portfolioImages.push(...newImageUrls);
        }

        // 5. Save the updated profile
        const updatedProfile = await profile.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            profile: updatedProfile
        });

    } catch (error) {
        console.log("Error in updateProviderProfile controller:", error);
        
        if (error.name === 'ValidationError') {
             return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getProviderProfileById = async (req, res) => {
    try {
        const { id: providerUserId } = req.params; // Get the user ID from the URL
        // console.log("Fetching profile for provider user ID:", providerUserId);
        // 1. Find the provider's profile and populate their user details
        const profile = await ProviderProfile.findOne({ _id: providerUserId })
            .populate('user', 'name profileImage'); // Get user's name and image

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Provider not found."
            });
        }

        // 2. Find all comments for this provider
        // We also populate the 'customer' field to show who wrote the comment
        // const comments = await Comment.find({ provider: providerUserId })
        //     .populate('customer', 'name profileImage')
        //     .sort({ createdAt: -1 }); 
            // Show newest comments first

        // 3. Send both the profile and the comments back
        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully.",
            profile,
            // comments
        });

    } catch (error) {
        console.log("Error in getProviderProfileById:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllProviders = async (req, res) => {
    try {
        // Find all provider profiles
        // Then, populate the 'user' field with just the name and profileImage
        const providers = await ProviderProfile.find({})
            .populate('user', 'name profileImage');

        return res.status(200).json({
            success: true,
            message: "All providers fetched successfully.",
            providers
        });

    } catch (error) {
        console.log("Error in getAllProviders:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

// Make sure to export it
export { becomeProvider, updateProviderProfile,getProviderProfileById,getAllProviders };