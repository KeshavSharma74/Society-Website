import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: "ProviderProfile",
        required: true
    },
    serviceCategory: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
        default: "pending"
    }
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;