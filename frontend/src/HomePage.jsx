import { useEffect, useState } from "react";
import { ThumbsUp, Trash2, MessageCircle } from "lucide-react";
import axiosInstance from "../axios";

export default function CommunityPage() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/get-comments"
        );
        setComments(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [userId]);

  const addComment = async (text, userid) => {
    try {
      const response = await axiosInstance.post(
        "/api/add-comment",
        {
          text: text,
          userid: userid,
        }
      );
      setComments([...comments, response.data]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const addReply = (commentId) => {
  axiosInstance.put(`/api/add-reply/${commentId}`, {
      replyText: replyText,
    });

    if (replyText.trim()) {
      setComments(
        comments.map((c) =>
          c._id === commentId ? { ...c, replies: [...c.replies, replyText] } : c
        )
      );
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const likeComment = async (commentId) => {
    await axiosInstance.put(`/api/like-comment/${commentId}`);

    setComments(
      comments.map((c) =>
        c._id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
    );
  };

  const deleteComment = async (commentId) => {
    await axiosInstance.delete(`/api/delete-comment/${commentId}`);
    setComments(comments.filter((c) => c._id !== commentId));
  };

  const handleLogin = async () => {
    const response = await axiosInstance.post("/api/login", {
      name: loginData.name,
      email: loginData.email,
      password: loginData.password,
    });

    setUserId(response.data.userid);
    console.log(response.data);

    console.log("Login data:", loginData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUserId(null);
    setLoginData({ name: "", email: "", password: "" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={loginData.name}
                  onChange={(e) =>
                    setLoginData({ ...loginData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleLogin}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setLoginData({ name: "", email: "", password: "" });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community</h1>
        <button
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          onClick={userId ? handleLogout : () => setShowLogin(true)}
        >
          {userId ? "Logout" : "Login"}
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded mb-2 resize-none"
          rows="3"
        />
        <button
          disabled={!userId}
          onClick={() => addComment(newComment, userId)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Post Comment
        </button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="bg-white p-4 rounded-lg shadow">
            <p className="mb-3">{comment.text}</p>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <button
                disabled={!userId}
                onClick={() => likeComment(comment._id)}
                className="flex items-center gap-1 hover:text-blue-500"
              >
                <ThumbsUp size={16} />
                <span>{comment.likes}</span>
              </button>

              <button
                disabled={!userId}
                onClick={() => setReplyingTo(comment._id)}
                className="flex items-center gap-1 hover:text-blue-500"
              >
                <MessageCircle size={16} />
                Reply
              </button>

              {comment.userid === userId && (
                <button
                  disabled={!userId}
                  onClick={() => deleteComment(comment._id)}
                  className="flex items-center gap-1 hover:text-red-500"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>

            {replyingTo === comment._id && (
              <div className="mt-3 ml-6">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border rounded mb-2 resize-none"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    disabled={!userId}
                    onClick={() => addReply(comment._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Reply
                  </button>
                  <button
                    disabled={!userId}
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="mt-3 ml-6 space-y-2">
                {comment.replies.map((reply, id) => (
                  <div key={id} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm mb-2">
                      {comment.replies[comment.replies.length - id - 1]}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
