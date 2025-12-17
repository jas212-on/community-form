import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import cors from "cors";
import { createServer } from "http";
import User from "./User.js";
import Comment from "./Comment.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password,
      });

      return res.status(201).json({
        message: "New user created",
        userid: user._id,
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      userid: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/get-comments", async (req, res) => {
  try {
    const comments = await Comment.find().sort({ _id: -1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/add-comment", async (req, res) => {
  try {
    const { text, userid } = req.body;

    const newComment = await Comment.create({
      text,
      likes: 0,
      replies: [],
      userid,
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/like-comment/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedComment = await Comment.findByIdAndUpdate(id, {
      $inc: { likes: 1 },
    });

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/add-reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText) {
      return res.status(400).json({ message: "Reply text required" });
    }

    const updatedComment = await Comment.findByIdAndUpdate(id, {
      $push: { replies: replyText },
    });

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/delete-comment/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server running !");
});

httpServer.listen(PORT, () => {
  console.log("Server starting at port " + PORT);
  connectDB();
});
