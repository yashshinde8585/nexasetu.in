import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CommentService from '../../api/commentApi';
import TeamService from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import { Send, User, MessageSquare } from 'lucide-react';
import { formatTime } from '../../utils/formatTime';

const TaskComments = ({ taskId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const messagesEndRef = useRef(null);

  const { data: commentsResponse, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => CommentService.getTaskComments(taskId),
  });

  const scrollToBottom = () => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === 'function'
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    socketService.connect();
    socketService.joinMission(taskId);

    socketService.onSignal((signal) => {
      queryClient.setQueryData(['comments', taskId], (oldData) => {
        if (!oldData) return oldData;
        if (oldData.data.comments.some((c) => c._id === signal._id))
          return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            comments: [...oldData.data.comments, signal],
          },
        };
      });
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      socketService.offSignal();
      socketService.leaveMission(taskId);
    };
  }, [taskId, queryClient]);

  const { data: membersResponse } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => TeamService.getMembers(),
  });

  const comments = commentsResponse?.data?.comments || [];
  const members = membersResponse?.data?.members || [];

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, content }) =>
      CommentService.addComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
      setTimeout(scrollToBottom, 50);
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    const lastAtPos = value.lastIndexOf('@');
    if (lastAtPos !== -1 && lastAtPos >= value.length - 15) {
      const query = value.substring(lastAtPos + 1).split(' ')[0];
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (memberName) => {
    const lastAtPos = newComment.lastIndexOf('@');
    const beforeAt = newComment.substring(0, lastAtPos);
    setNewComment(`${beforeAt}@${memberName} `);
    setShowMentions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ taskId, content: newComment });
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border border-border-subtle rounded-xl shadow-sm overflow-hidden">
      {/* Discussion Header */}
      <div className="px-4 py-3.5 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MessageSquare size={14} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-text">
              Discussion
            </h3>
            <span className="text-[11px] font-medium text-text-subtle">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 sm:space-y-4 min-h-[90px] max-h-[360px] sm:max-h-[460px] custom-scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-text-subtle">
            <p className="text-xs font-medium">Loading comments...</p>
          </div>
        ) : comments.map((comment, index) => {
          const isOwn = comment.user?._id === user?._id;

          return (
            <div
              key={comment._id || index}
              className={`flex items-start gap-2.5 sm:gap-3 group animate-in slide-in-from-bottom-1 duration-300 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border shrink-0 transition-transform group-hover:scale-105 ${
                  isOwn
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-background-elevated border-border-subtle text-text-subtle'
                }`}
              >
                {comment.user?.name ? comment.user.name[0].toUpperCase() : 'U'}
              </div>

              <div
                className={`flex flex-col flex-1 min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header */}
                <div
                  className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    <span className="text-xs font-semibold text-text truncate max-w-[150px]">
                      {comment.user?.name}
                    </span>
                  )}
                  <span className="text-[11px] text-text-subtle shrink-0">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>

                {/* Message Content */}
                <div className={`text-xs sm:text-sm leading-relaxed p-2.5 sm:p-3 rounded-xl max-w-[92%] sm:max-w-[85%] text-left border break-words ${
                  isOwn
                    ? 'bg-primary/10 border-primary/20 text-text'
                    : 'bg-background-elevated border-border-subtle text-text'
                }`}>
                  {comment.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-1" />

        {!isLoading && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-6 sm:py-8 text-text-subtle">
            <MessageSquare size={28} className="mb-2 opacity-30 text-text" />
            <p className="text-xs font-medium text-text">No comments yet</p>
            <p className="text-[11px] text-text-subtle mt-0.5">Start the conversation by writing a comment below.</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border-subtle relative">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-card border border-border-subtle rounded-xl shadow-xl overflow-hidden z-50 max-h-40 sm:max-h-48 overflow-y-auto">
            {filteredMembers.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => selectMention(member.name)}
                className="w-full px-3 py-2 min-h-[38px] text-left flex items-center gap-2.5 hover:bg-background-elevated transition-colors text-xs text-text cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {member.name[0]}
                </div>
                <span className="font-medium text-text truncate">
                  {member.name}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={handleInputChange}
            placeholder="Write a comment... (Type @ to mention)"
            className="w-full bg-background-elevated border border-border-subtle rounded-lg py-2.5 pl-3.5 pr-11 text-base sm:text-xs text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors min-h-[44px]"
            aria-label="Write a comment"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            title="Send comment"
            aria-label="Send comment"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-text-subtle hover:text-primary transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Scrollbar Styling */}
      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TaskComments;
