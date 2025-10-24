import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import ProviderProfile from "../models/providerProfile.model.js";
import ServiceOffering from "../models/serviceOffering.model.js"; // <-- Import ServiceOffering

/**
 * @description Create a new booking
 * @route POST /api/bookings/:providerId
 */
const createBooking = async (req, res) => {
    try {
        const { providerId } = req.params; // This is the ProviderProfile ID
        const { serviceCategory, scheduledDate, notes } = req.body;
        const customerId = req.user._id; 

        // 1. Validation
        if (!serviceCategory || !scheduledDate) {
            return res.status(400).json({ success: false, message: "Service and date are required." });
        }

        // 2. Check if the provider's PROFILE exists
        const providerProfile = await ProviderProfile.findById(providerId);
        if (!providerProfile) {
            return res.status(404).json({ success: false, message: "Service provider not found." });
        }

        // 3. --- VALIDATION CHANGED ---
        // Check if the provider actually offers this service
        const serviceExists = await ServiceOffering.findOne({
            provider: providerId,
            serviceCategory: serviceCategory
        });

        if (!serviceExists) {
             return res.status(400).json({ success: false, message: "The provider does not offer this service." });
        }
        // --- END OF CHANGE ---

        // 4. Create and save the new booking
        const newBooking = await Booking.create({
            customer: customerId,
            provider: providerId, // Store the ProviderProfile ID
            serviceCategory,
            scheduledDate,
            notes,
        });

        return res.status(201).json({
            success: true,
            message: "Booking request created successfully.",
            booking: newBooking
        });

    } catch (error) {
        console.error("Error in createBooking controller:", error.message);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- (The other 3 functions are UNCHANGED and still correct) ---

/**
 * @description Get all bookings for the logged-in customer
 * @route GET /api/bookings/my-bookings
 */
const getCustomerBookings = async (req, res) => {
    try {
        const customerId = req.user._id;
        
        const bookings = await Booking.find({ customer: customerId })
            .populate({
                path: 'provider', 
                populate: {
                    path: 'user', 
                    select: 'name phoneNumber profileImage' 
                }
            })
            .sort({ scheduledDate: -1 });

        return res.status(200).json({
            success: true,
            message: "Customer bookings fetched successfully.",
            bookings
        });
    } catch (error) {
        console.error("Error in getCustomerBookings controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Get all bookings for the logged-in provider
 * @route GET /api/bookings/my-requests
 */
const getProviderBookings = async (req, res) => {
    try {
        const providerUserId = req.user._id;

        const providerProfile = await ProviderProfile.findOne({ user: providerUserId });
        if (!providerProfile) {
             return res.status(404).json({ success: false, message: "Provider profile not found." });
        }

        const bookings = await Booking.find({ provider: providerProfile._id })
            .populate('customer', 'name phoneNumber profileImage') 
            .sort({ scheduledDate: -1 });

        return res.status(200).json({
            success: true,
            message: "Provider bookings fetched successfully.",
            bookings
        });
    } catch (error) {
        console.error("Error in getProviderBookings controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @description Update the status of a booking
 * @route PUT /api/bookings/update-status/:id
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { status } = req.body;
        const user = req.user; 

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const validStatuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status provided." });
        }

        const isCustomer = user.role === 'customer' && booking.customer.toString() === user._id.toString();

        const providerProfile = await ProviderProfile.findOne({ user: user._id });
        const isProvider = user.role === 'provider' && 
                           providerProfile && 
                           booking.provider.toString() === providerProfile._id.toString();

        if (!isCustomer && !isProvider) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this booking." });
        }

        if (isCustomer && status !== 'cancelled') {
            return res.status(403).json({ success: false, message: "Customers can only cancel bookings." });
        }
        if (isProvider && (status === 'cancelled' || status === 'pending')) {
             return res.status(403).json({ success: false, message: "Providers can only accept, reject, or complete." });
        }

        booking.status = status;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: `Booking status updated to ${status}.`,
            booking
        });

    } catch (error) {
        console.error("Error in updateBookingStatus controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export {
    createBooking,
    getCustomerBookings,
    getProviderBookings,
    updateBookingStatus
};