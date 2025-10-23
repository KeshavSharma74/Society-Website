import mongoose from "mongoose";

const { Schema } = mongoose;

// --- Define the allowed categories ---
// Any new category you want to add must be added to this array.
const allowedServiceCategories = [
    "Baking (Cookies/Cakes)",
    "Home Catering",
    "Handmade Crafts",
    "Tailoring & Alterations",
    "Knitting & Crochet",
    "Embroidery",
    "Makeup Artist",
    "Henna Artist",
    "Childcare / Babysitting",
    "Tutoring",
    "Event Planning",
    "Graphic Design",
    "Content Writing",
    "Social Media Management",
    "Home Cleaning",
    "Laundry Services"
];

const providerProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bio: {
        type: String,
        required:true,
        default: ""
    },
    experience: {
        type: Number,
        required:true,
        default: 0
    },
    serviceCategories: {
        type: [String], // It's still an array of strings
        required:true,
        // This 'enum' ensures that any string added to this array 
        // MUST be one of the values from the 'allowedServiceCategories' list.
        enum: allowedServiceCategories 
    },
    portfolioImages: {
        type: [String],
        required:true,
        default: []
    },
}, { timestamps: true });

const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);

export default ProviderProfile;