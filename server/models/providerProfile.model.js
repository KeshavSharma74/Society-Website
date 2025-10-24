import mongoose from "mongoose";

const { Schema } = mongoose;

// This schema represents the PROVIDER, not their individual services.
const providerProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // A user can only have one provider profile
    },
    bio: {
        type: String,
        required: [true, "A bio is required"],
        maxlength: [500, "Bio cannot be more than 500 characters"]
    },
    experience: {
        type: Number, // Represents years of experience
        required: [true, "Experience is required"],
        min: [0, "Experience cannot be negative"],
        default: 0
    }
    // All other fields (serviceCategories, portfolioImages, ratings)
    // have been moved to the ServiceOffering model or removed per your requests.

}, { 
    timestamps: true,
    // We add these to ensure virtuals are included when we send data as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// This virtual field creates a "link" to find all ServiceOfferings
// that belong to this ProviderProfile. It is not saved in the database.
providerProfileSchema.virtual('serviceOfferings', {
    ref: 'ServiceOffering', // The model to use
    localField: '_id',      // Find ServiceOfferings where...
    foreignField: 'provider' // ...'provider' field matches this profile's '_id'
});


const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);

export default ProviderProfile;