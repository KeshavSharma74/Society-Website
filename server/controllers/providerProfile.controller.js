import User from "../models/user.model.js";
import ProviderProfile from "../models/providerProfile.model.js";
import ServiceOffering from "../models/serviceOffering.model.js";
import Booking from "../models/booking.model.js"; // <-- You need to import Booking model here for dashboard stats
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// --- (Helper functions for Cloudinary) ---
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "service_offerings" }, // Make sure your Cloudinary folder is set
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

const deleteFromCloudinary = (public_id) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(public_id, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};


// --- Provider Profile Controllers ---

/**
 * @description Create a basic provider profile (Step 1 of becoming a provider)
 * @route POST /api/provider-profile/become-provider
 * @access Private (Auth User)
 */
 const becomeProvider = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bio, experience } = req.body;

        if (!bio || experience === undefined) {
            return res.status(400).json({ success: false, message: "Bio and experience are required." });
        }

        const existingProfile = await ProviderProfile.findOne({ user: userId });
        if (existingProfile) {
            return res.status(400).json({ success: false, message: "You are already a provider." });
        }

        const newProfile = await ProviderProfile.create({
            user: userId,
            bio,
            experience
        });

        // Update the user's role to 'provider'
        await User.findByIdAndUpdate(userId, { role: "provider" });

        return res.status(201).json({
            success: true,
            message: "Congratulations! You are now a provider. Proceed to add your services.",
            profile: newProfile
        });
    } catch (error) {
        console.error("Error in becomeProvider:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @description Update a provider's basic profile (bio, experience)
 * @route PUT /api/provider-profile/
 * @access Private (Provider)
 */
 const updateProviderProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bio, experience } = req.body;

        const profile = await ProviderProfile.findOneAndUpdate(
            { user: userId },
            { bio, experience },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ success: false, message: "Provider profile not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            profile
        });
    } catch (error) {
        console.error("Error in updateProviderProfile:", error.message);
        // Mongoose validation errors will be caught here
        return res.status(400).json({ success: false, message: error.message });
    }
};

// --- Service Offering Controllers ---

/**
 * @description Add a new service offering to a provider's profile
 * @route POST /api/provider-profile/service
 * @access Private (Provider)
 */
 const addServiceOffering = async (req, res) => {
    try {
        const userId = req.user._id;
        const { serviceCategory, subCategories, keywords, description } = req.body;

        // Ensure images are provided if this is a new service offering
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "Portfolio images are required for a service." });
        }
        
        const profile = await ProviderProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Provider profile not found." });
        }

        // 1. Upload images to Cloudinary
        const uploadPromises = req.files.map(file => uploadBufferToCloudinary(file.buffer));
        const portfolioImages = await Promise.all(uploadPromises); 

        // 2. Create the service offering document
        const newService = new ServiceOffering({
            provider: profile._id,
            serviceCategory,
            // Ensure subCategories and keywords are arrays
            subCategories: Array.isArray(subCategories) ? subCategories : (subCategories ? [subCategories] : []),
            keywords: Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []),
            description,
            portfolioImages
        });
        
        // 3. Save the new service offering (triggers pre-save validation)
        await newService.save();

        return res.status(201).json({
            success: true,
            message: "Service added successfully.",
            service: newService
        });

    } catch (error) {
        console.error("Error in addServiceOffering:", error.message);
        // This will catch Mongoose validation errors (like invalid subcategory/keyword)
        return res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @description Delete a service offering and its associated images
 * @route DELETE /api/provider-profile/service/:serviceId
 * @access Private (Provider)
 */
 const deleteServiceOffering = async (req, res) => {
    try {
        const userId = req.user._id;
        const { serviceId } = req.params;

        const profile = await ProviderProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Provider profile not found." });
        }

        const service = await ServiceOffering.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service offering not found." });
        }

        // Verify ownership: only the provider who owns the service can delete it
        if (service.provider.toString() !== profile._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this service." });
        }

        // 1. Delete associated images from Cloudinary
        const deletePromises = service.portfolioImages.map(img => deleteFromCloudinary(img.public_id));
        await Promise.all(deletePromises);
        
        // 2. Delete the service offering from MongoDB
        await ServiceOffering.findByIdAndDelete(serviceId);

        return res.status(200).json({ success: true, message: "Service deleted successfully." });
        
    } catch (error) {
        console.error("Error in deleteServiceOffering:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @description Get all dashboard statistics for the logged-in provider
 * @route GET /api/provider-profile/dashboard/stats
 * @access Private (Provider)
 */
const getProviderDashboardStats = async (req, res) => {
    try {
        const providerUserId = req.user._id;

        // 1. Find the provider's profile
        const providerProfile = await ProviderProfile.findOne({ user: providerUserId });
        if (!providerProfile) {
            return res.status(404).json({ success: false, message: "Provider profile not found." });
        }
        const providerProfileId = providerProfile._id;

        // 2. Get status counts and total bookings in one query
        const bookingStats = await Booking.aggregate([
            { $match: { provider: providerProfileId } }, // Match bookings for THIS provider
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Format the stats into a clean object
        const statusCounts = {
            pending: 0,
            accepted: 0,
            rejected: 0,
            completed: 0,
            cancelled: 0
        };
        let totalBookings = 0;
        
        bookingStats.forEach(stat => {
            if (statusCounts.hasOwnProperty(stat._id)) {
                statusCounts[stat._id] = stat.count;
            }
            totalBookings += stat.count;
        });

        // 3. Get 5 Recent Bookings for this provider
        const recentBookings = await Booking.find({ provider: providerProfileId })
            .populate('customer', 'name profileImage') // Populate customer details
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(5);

        // 4. Send the final response
        return res.status(200).json({
            success: true,
            data: {
                totalBookings,
                statusCounts,
                recentBookings
            }
        });

    } catch (error) {
        console.error("Error in getProviderDashboardStats controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// --- Public Fetching Controllers ---

/**
 * @description Get all approved providers (for the public list page)
 * @route GET /api/provider-profile/
 * @access Public
 */
 const getAllProviders = async (req, res) => {
    try {
        // Find all provider profiles and populate their associated user and service offerings
        const providers = await ProviderProfile.find()
            .populate('user', 'name profileImage') // Get user's public info (name, profile image)
            .populate('serviceOfferings'); // Get all their service offerings (with images, categories, etc.)
        
        return res.status(200).json({
            success: true,
            providers
        });
    } catch (error) {
        console.error("Error in getAllProviders:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Get one provider's full details by their PROFILE ID (for detail page)
 * @route GET /api/provider-profile/:id
 * @access Public
 */
const getProviderById = async (req, res) => {
    try {
        const provider = await ProviderProfile.findById(req.params.id)
            .populate('user', 'name profileImage') // Get user's public info
            .populate('serviceOfferings'); // Get all their service offerings

        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found." });
        }
        
        // TODO: You would also fetch and send comments here if they are linked to ProviderProfile
        // const comments = await Comment.find({ provider: provider._id }).populate('customer').sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            provider
            // comments: comments // Uncomment if you add comment fetching
        });
    } catch (error) {
        console.error("Error in getProviderById:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- Export all functions from this file ---
export {
    becomeProvider,
    updateProviderProfile,
    addServiceOffering,
    deleteServiceOffering,
    getProviderDashboardStats, // <-- This was the missing export!
    getAllProviders,
    getProviderById,
};