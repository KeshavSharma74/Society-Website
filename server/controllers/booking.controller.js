import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import ProviderProfile from "../models/providerProfile.model.js";

/**
 * @description Create a new booking
 * @route POST /api/bookings/
 * @access Private (Customer)
 */
const createBooking = async (req, res) => {
    try {
        // 'providerId' is now the ID of the ProviderProfile
        const { providerId } = req.params;
        const { serviceCategory, scheduledDate, notes } = req.body;
        const customerId = req.user._id; // Logged-in user is the customer

        // 1. Validation
        if (!providerId || !serviceCategory || !scheduledDate) {
            return res.status(400).json({ success: false, message: "Provider, service, and date are required." });
        }

        // 2. Check if the provider's PROFILE exists
        const providerProfile = await ProviderProfile.findById(providerId);
        if (!providerProfile) {
            return res.status(404).json({ success: false, message: "Service provider not found." });
        }

        // 3. Check if the provider offers this service
        if (!providerProfile.serviceCategories.includes(serviceCategory)) {
             return res.status(400).json({ success: false, message: "The provider does not offer this service." });
        }

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

/**
 * @description Get all bookings for the logged-in customer
 * @route GET /api/bookings/my-bookings
 * @access Private (Customer)
 */
const getCustomerBookings = async (req, res) => {
    try {
        const customerId = req.user._id;
        
        const bookings = await Booking.find({ customer: customerId })
            // We must nested-populate to get the User's details from the ProviderProfile
            .populate({
                path: 'provider', // 1. Populate the ProviderProfile
                populate: {
                    path: 'user', // 2. Populate the User field *within* the ProviderProfile
                    select: 'name phoneNumber profileImage' // 3. Select only these User fields
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
 * @access Private (Provider)
 */
const getProviderBookings = async (req, res) => {
    try {
        const providerUserId = req.user._id;

        // 1. Find the provider's profile using their User ID
        const providerProfile = await ProviderProfile.findOne({ user: providerUserId });
        if (!providerProfile) {
             return res.status(404).json({ success: false, message: "Provider profile not found." });
        }

        // 2. Find all bookings that reference this provider's PROFILE ID
        const bookings = await Booking.find({ provider: providerProfile._id })
            .populate('customer', 'name phoneNumber profileImage') // Populate customer details
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
 * @access Private (Customer or Provider)
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { status } = req.body;
        const user = req.user; // from protect middleware

        // 1. Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        // 2. Check if the status from the body is valid
        const validStatuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status provided." });
        }

        // 3. --- Authorization Logic ---
        const isCustomer = user.role === 'customer' && booking.customer.toString() === user._id.toString();

        // Find the provider's profile ID to see if it matches the one on the booking
        const providerProfile = await ProviderProfile.findOne({ user: user._id });
        const isProvider = user.role === 'provider' && 
                           providerProfile && 
                           booking.provider.toString() === providerProfile._id.toString();

        if (!isCustomer && !isProvider) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this booking." });
        }

        // 4. Rules for who can set which status
        if (isCustomer && status !== 'cancelled') {
            return res.status(403).json({ success: false, message: "Customers can only cancel bookings." });
        }
        if (isProvider && (status === 'cancelled' || status === 'pending')) {
             return res.status(403).json({ success: false, message: "Providers can only accept, reject, or complete." });
        }

        // 5. Update and save
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