import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import ProviderProfile from "../models/providerProfile.model.js";

/**
 * @description Create a new comment for a provider
 * @route POST /api/comments/create-comment/:providerId (This ID is the ProviderProfile ID)
 * @access Private (Any logged-in user)
 */
const createComment = async (req, res) => {
    try {
        // This ID is the provider's PROFILE ID
        const { providerId } = req.params; 
        const { comment } = req.body;
        const customerId = req.user._id; // This is the customer's USER ID

        if (!comment) {
            return res.status(400).json({ success: false, message: "Comment text is required." });
        }

        // 1. Check if the provider's PROFILE exists
        const providerProfile = await ProviderProfile.findById(providerId);

        if (!providerProfile) {
            return res.status(404).json({ success: false, message: "Provider profile not found." });
        }
        
        // 2. Prevent a user from commenting on their own profile
        if (providerProfile.user.toString() === customerId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot comment on your own profile." });
        }

        // 3. Create the new comment
        const newComment = await Comment.create({
            provider: providerId, // <-- CORRECTED: Save the ProviderProfile ID
            customer: customerId,
            comment
        });

        return res.status(201).json({
            success: true,
            message: "Comment posted successfully.",
            comment: newComment
        });

    } catch (error) {
        console.error("Error in createComment controller:", error.message);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Get all comments for a specific provider
 * @route GET /api/comments/get-comments/:providerId (This ID is the ProviderProfile ID)
 * @access Public
 */

const getCommentsForProvider = async (req, res) => {
    try {
        // This ID is the provider's PROFILE ID
        const { providerId } = req.params; 

        // 1. Find all comments where 'provider' matches the ProviderProfile ID
        const comments = await Comment.find({ provider: providerId }) // <-- CORRECTED
            .populate('customer', 'name profileImage') // Get commenter's name and image
            .sort({ createdAt: -1 }); // Show newest comments first

        return res.status(200).json({
            success: true,
            comments
        });

    } catch (error) {
        console.error("Error in getCommentsForProvider controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Update an existing comment
 * @route PUT /api/comments/update-comment/:commentId
 * @access Private (Customer who wrote it)
 */
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { comment } = req.body;
        const customerId = req.user._id;

        if (!comment) {
            return res.status(400).json({ success: false, message: "Comment text is required." });
        }

        const existingComment = await Comment.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({ success: false, message: "Comment not found." });
        }

        // Check if the user is the author
        if (existingComment.customer.toString() !== customerId.toString()) {
            return res.status(403).json({ success: false, message: "You can only update your own comments." });
        }
        
        existingComment.comment = comment;
        const updatedComment = await existingComment.save();

        return res.status(200).json({
            success: true,
            message: "Comment updated successfully.",
            comment: updatedComment
        });

    } catch (error) {
        console.error("Error in updateComment controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Delete a comment
 * @route DELETE /api/comments/delete/:commentId
 * @access Private (Customer who wrote it or Admin)
 */
const deleteComment = async (req,res) => {
    try {
        const { commentId } = req.params;
        const user = req.user;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found." });
        }

        // Check if user is the author OR an admin
        const isAuthor = comment.customer.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this comment." });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully."
        });

    } catch (error) {
        console.error("Error in deleteComment controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export {
    createComment,
    getCommentsForProvider,
    updateComment,
    deleteComment
};