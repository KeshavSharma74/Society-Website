import Booking from "../models/booking.model.js";

/**
 * @description Get all dashboard statistics for the admin
 * @route GET /api/admin/dashboard-stats
 * @access Private (Admin)
 */
const getAdminDashboardStats = async (req, res) => {
    try {
        // 1. Get status counts and total bookings in one query
        const bookingStats = await Booking.aggregate([
            // $match is not needed, we want all bookings
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

        // 2. Get 5 Recent Bookings from the entire platform
        const recentBookings = await Booking.find({})
            .populate('customer', 'name profileImage') // Populate the customer
            .populate({ // Nested populate for the provider
                path: 'provider',
                populate: {
                    path: 'user',
                    select: 'name profileImage'
                }
            })
            .sort({ createdAt: -1 })
            .limit(5);

        // 3. Send the final response
        return res.status(200).json({
            success: true,
            data: {
                totalBookings,
                statusCounts,
                recentBookings
            }
        });

    } catch (error) {
        console.error("Error in getAdminDashboardStats controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


/**
 * @description Get all bookings on the platform
 * @route GET /api/admin/all-bookings
 * @access Private (Admin)
 */
const getAllBookings = async (req, res) => {
    try {
        // Find all bookings
        const bookings = await Booking.find({})
            .populate('customer', 'name profileImage email') // Populate customer details
            .populate({ // Nested populate for the provider
                path: 'provider',
                select: 'user serviceCategories', // Select fields from ProviderProfile
                populate: {
                    path: 'user',
                    select: 'name profileImage email' // Select fields from User
                }
            })
            .sort({ createdAt: -1 }); // Show newest first

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (error) {
        console.error("Error in getAllBookings controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export { 
    getAdminDashboardStats,
    getAllBookings
};