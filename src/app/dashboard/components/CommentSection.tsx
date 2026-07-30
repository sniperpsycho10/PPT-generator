"use client";

import { useState, useEffect } from "react";
import { Send, User as UserIcon } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  submissionId?: string;
  suggestionId?: string;
}

export default function CommentSection({ submissionId, suggestionId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [submissionId, suggestionId]);

  const fetchComments = async () => {
    try {
      const query = submissionId ? `submissionId=${submissionId}` : `suggestionId=${suggestionId}`;
      const res = await fetch(`/api/comments?${query}`);
      const json = await res.json();
      if (json.success) {
        setComments(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newComment,
          submissionId,
          suggestionId
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading comments...</div>;

  return (
    <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
      <h3 className="text-lg font-semibold text-white/90">Discussion</h3>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-sm text-white/40 italic">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                {comment.user.image || comment.user.name ? (
                  <Avatar 
                    src={comment.user.image} 
                    name={comment.user.name || 'User'} 
                    size={32}
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-white/90 text-sm">{comment.user.name || "Unknown User"}</span>
                  <span className="text-xs text-white/40">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 items-end pt-2">
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          placeholder="Write a comment..."
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          onClick={handlePost}
          disabled={submitting || !newComment.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
