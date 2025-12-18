import { useEffect, useState } from "react";
import { ThumbsUp, Trash2, MessageCircle, User } from "lucide-react";
import axiosInstance from "./axios";

export default function CommunityPage() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState({
    id: null,
    name: null,
    email: null,
    photo: null,
    provider: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get("/auth/current-user");
        console.log(res.data.photo);
        setUser(res.data);
        setIsLoggedIn(true);
      } catch (err) {
        console.error(err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axiosInstance.get("/api/get-comments");
        setComments(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [user]);

  const addComment = async (text, userid) => {
    try {
      const response = await axiosInstance.post("/api/add-comment", {
        text: text,
        userid: userid,
      });
      setComments([response.data, ...comments]);
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
    setComments(
      comments.map((c) =>
        c._id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
    );
    await axiosInstance.put(`/api/like-comment/${commentId}`);
  };

  const deleteComment = async (commentId) => {
    await axiosInstance.delete(`/api/delete-comment/${commentId}`);
    setComments(comments.filter((c) => c._id !== commentId));
  };

  const handleLogin = async () => {
    window.location.href = "https://community-form-e22b.onrender.com/auth/google";
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.get("/auth/logout");
      setIsLoggedIn(false);
      setUser({
        id: null,
        name: null,
        email: null,
        photo: null,
        provider: null,
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Community
          </h1>
          <div className="flex gap-3 items-center">
            {user.id && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <User size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">{user.name}</span>
              </div>
            )}
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                user
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              }`}
              onClick={user.id ? handleLogout : handleLogin}
            >
              {user.id ? "Logout" : "Login"}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              user.id ? "Share your thoughts..." : "Please login to comment"
            }
            className="w-full p-4 border-2 border-gray-200 rounded-xl mb-3 resize-none focus:border-blue-500 focus:outline-none transition"
            rows="4"
            disabled={!isLoggedIn}
          />
          <button
            disabled={!isLoggedIn}
            onClick={() => addComment(newComment, user.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              user.id
                ? "bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Post Comment
          </button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <img
                    src={user.photo}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">
                      {comment.username}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                <button
                  disabled={!isLoggedIn}
                  onClick={() => likeComment(comment._id)}
                  className={`flex items-center gap-1 transition ${
                    user.id
                      ? "hover:text-blue-500"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span className="font-semibold">{comment.likes}</span>
                </button>

                <button
                  disabled={!isLoggedIn}
                  onClick={() => setReplyingTo(comment._id)}
                  className={`flex items-center gap-1 transition ${
                    user.id
                      ? "hover:text-blue-500"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <MessageCircle size={16} />
                  Reply
                </button>

                {comment.userid === user.id && (
                  <button
                    onClick={() => deleteComment(comment._id)}
                    className="flex items-center gap-1 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>

              {replyingTo === comment._id && (
                <div className="mt-4 ml-13 bg-gray-50 p-4 rounded-xl">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg mb-3 resize-none focus:border-blue-500 focus:outline-none transition"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addReply(comment._id)}
                      className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-600 hover:to-indigo-700 font-semibold transition"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {comment.replies.length > 0 && (
                <div className="mt-4 ml-13 space-y-3">
                  {comment.replies.map((reply, id) => (
                    <div
                      key={id}
                      className="bg-linear-to-r from-gray-50 to-blue-50 p-2 rounded-xl"
                    >
                      <div className="">
                        <div className="">
                          <p className="text-sm text-gray-700 mb-2">{reply}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
