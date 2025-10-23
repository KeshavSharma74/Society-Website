import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema({
    provider: {
        type: Schema.Types.ObjectId,
        ref: "ProviderProfile",
        required: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;