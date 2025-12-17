import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: String,
  likes: Number,
  replies: [String],
  userid: String
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;