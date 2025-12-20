import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import cors from "cors";
import { createServer } from "http";
import User from "./User.js";
import Comment from "./Comment.js";
import session from "express-session";
import passport from "passport";
import "./passport.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://community-form-1.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());

app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: "keyboard cat", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,      
      sameSite: isProduction ? "none" : "lax",  
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL,
    session: true,
  }),
  (req, res) => {
    // Successful login
    res.redirect(process.env.CLIENT_URL);
  }
);


// Logout
app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie("connect.sid", { path: "/" });
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
};

app.get("/auth/current-user", isAuth, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    photo: req.user.profilePic,
    likedComments: req.user.likedComments
  });
});

app.get("/api/get-comments", async (req, res) => {
  try {
    const comments = await Comment.find().sort({ _id: -1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/add-comment", isAuth, async (req, res) => {
  try {
    const { text, userid } = req.body;

    const newComment = await Comment.create({
      text,
      likes: 0,
      replies: [],
      userid,
      username: req.user.name,
      likedComments: []
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/like-comment/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyLiked = user.likedComments.includes(id);

    if (alreadyLiked) {
      // Unlike
      user.likedComments.pull(id);
      comment.likes -= 1;
    } else {
      // Like
      user.likedComments.push(id);
      comment.likes += 1;
    }

    await user.save();
    await comment.save();

    res.json({
      liked: !alreadyLiked,
      likes: comment.likes,
      commentId: comment._id,
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ message: error.message });
  }
});


app.put("/api/add-reply/:id", isAuth, async (req, res) => {
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

app.delete("/api/delete-comment/:id", isAuth, async (req, res) => {
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
