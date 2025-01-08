import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
    {
        videofile: {
            type: String,
            require: true,
        },
        thumbnail: {
            type: String,
            require: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "user"
        },
        title: {
            type: String,
            require: true,
            unique: true,
        },
        description: {
            type: String,
            require: true
        },
        views: {
            tyre: Number,
            default: 0
        },
        duration: {
            type: Number,
            require: true
        },
        isPublished: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)
videoSchema.plugin(mongooseAggregatePaginate)
const video = mongoose.model("Video", videoSchema);

export default video;