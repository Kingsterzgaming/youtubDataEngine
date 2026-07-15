import React, { useState, useEffect } from "react";
import { VideoItem, CommentItem } from "../types";
import { MessageSquare, Heart, Search, Sparkles, AlertCircle, Loader2, ArrowRightLeft, Smile, Meh, Frown, HelpCircle, CheckSquare } from "lucide-react";
import { getAiHeaders } from "../lib/aiConfig";

interface CommentAnalyzerProps {
  apiKey: string;
  videos: VideoItem[];
}

interface AiCommentReport {
  sentimentRatio: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyThemes: string[];
  userQuestions: string[];
  creatorResponseStrategy: string;
}

export default function CommentAnalyzer({ apiKey, videos }: CommentAnalyzerProps) {
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // AI State
  const [aiReport, setAiReport] = useState<AiCommentReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Pick first video on load
  useEffect(() => {
    if (videos.length > 0 && !selectedVideoId) {
      setSelectedVideoId(videos[0].id);
    }
  }, [videos, selectedVideoId]);

  // Fetch comments when video changes
  useEffect(() => {
    if (selectedVideoId) {
      fetchCommentsForVideo(selectedVideoId);
    }
  }, [selectedVideoId]);

  const fetchCommentsForVideo = async (videoId: string) => {
    setLoadingComments(true);
    setCommentsError(null);
    setComments([]);
    setAiReport(null);
    setAiError(null);

    try {
      const res = await fetch(`/api/youtube/video/${videoId}/comments?limit=40`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("YOUTUBE_API_KEY_MISSING");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to load video comments.");
      }

      const data = await res.json();
      setComments(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setCommentsError("Your YouTube Data API key is missing. Go to Settings to configure.");
      } else {
        setCommentsError(err.message || "Failed to load comments.");
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (comments.length === 0) return;
    setAnalyzing(true);
    setAiError(null);
    setAiReport(null);

    const activeVideo = videos.find((v) => v.id === selectedVideoId);

    try {
      const res = await fetch("/api/ai/analyze-comments", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({
          comments: comments,
          videoTitle: activeVideo?.title || "Active Video"
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze comments.");
      }

      const report = await res.json();
      setAiReport(report);
    } catch (err: any) {
      console.error(err);
      if (err.message === "NO_AI_KEYS_CONFIGURED" || err.message === "GEMINI_API_KEY_NOT_CONFIGURED" || err.status === 401) {
        setAiError("No AI API Keys are configured. Please open Settings and supply a Google Gemini, OpenAI, or Anthropic credential to run comments analysis.");
      } else {
        setAiError(err.message || "An error occurred during AI analysis.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  // Filter local comments
  const filteredComments = comments.filter((c) =>
    c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="comment-analyzer">
      {/* Selection Panel */}
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.04]">
        <h3 className="font-display font-bold text-white text-base mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-red animate-pulse" /> Selector &amp; Sentiment Feed
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-2">
              Select Video to Inspect
            </label>
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 outline-none focus:border-brand-red/40 cursor-pointer font-semibold"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={analyzing || comments.length === 0 || loadingComments}
              className="w-full sm:w-auto bg-gradient-to-r from-brand-red to-brand-purple hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Performing Community Audit...
                </>
              ) : (
                <>
                  Analyze Sentiment <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Comments Feed on Left, AI Analysis Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments Feed Panel */}
        <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col h-[680px] border border-white/[0.02]">
          <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
            <h4 className="font-display font-bold text-white text-sm">
              Live Comment Threads {comments.length > 0 && `(${comments.length})`}
            </h4>
            
            {/* Search Comments */}
            {comments.length > 0 && (
              <div className="relative flex items-center bg-zinc-950/40 border border-white/5 focus-within:border-brand-red/40 rounded-xl px-3 py-1.5 text-xs max-w-[180px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter comments..."
                  className="w-full bg-transparent text-zinc-100 outline-none placeholder-zinc-600 font-medium"
                />
              </div>
            )}
          </div>

          {/* Comments Loading/Error or Feed */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {loadingComments ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-red" />
                <p className="font-semibold text-zinc-400">Retrieving real video comments from YouTube...</p>
              </div>
            ) : commentsError ? (
              <div className="h-full flex flex-col items-center justify-center text-brand-red text-center p-6">
                <AlertCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
                <p className="font-semibold">Unable to fetch comments</p>
                <p className="text-xs opacity-80 mt-1 max-w-xs">{commentsError}</p>
              </div>
            ) : filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <div key={comment.id} className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.author}
                        referrerPolicy="no-referrer"
                        className="w-6.5 h-6.5 rounded-full bg-zinc-800 border border-white/10"
                      />
                      <span className="text-xs font-bold text-zinc-200 line-clamp-1">{comment.author}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{new Date(comment.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.text }} />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono font-extrabold">
                    <Heart className="w-3 h-3 text-brand-red fill-brand-red/10" /> {comment.likeCount} likes
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs text-center p-6">
                <MessageSquare className="w-10 h-10 mb-2.5 stroke-[1.5]" />
                <p className="font-bold text-zinc-400">No comments found</p>
                <p className="text-zinc-600 mt-1.5 max-w-xs leading-relaxed">Make sure this video is public and has comments enabled.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Sentiment Analysis Output */}
        <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col h-[680px] overflow-y-auto border border-white/[0.02]">
          <div className="flex items-center gap-2 text-zinc-200 font-display font-bold text-sm mb-5 border-b border-white/5 pb-4">
            <Sparkles className="w-4.5 h-4.5 text-brand-red" /> AI Community Audit Report
          </div>

          {analyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-6 text-center">
              <Loader2 className="w-10 h-10 animate-spin mb-3.5 text-brand-red" />
              <h5 className="font-display font-bold text-zinc-200 text-sm mb-1.5">Engaging Multi-Agent Pipeline</h5>
              <p className="max-w-xs text-zinc-500 leading-relaxed">
                Reading recent top comment threads, assessing emotional tone indices, and extracting tactical feedback patterns...
              </p>
            </div>
          ) : aiError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-amber-500 text-center p-6">
              <AlertCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="font-bold">AI Analysis Blocked</p>
              <p className="text-xs opacity-80 mt-1.5 max-w-xs">{aiError}</p>
            </div>
          ) : aiReport ? (
            <div className="space-y-6">
              {/* Sentiment Proportions Card */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-4.5 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Sentiment Proportions
                </h5>

                <div className="space-y-4">
                  {/* Positive */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-400">
                      <span className="flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> Positive Community Sentiment</span>
                      <span>{aiReport.sentimentRatio.positive}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" style={{ width: `${aiReport.sentimentRatio.positive}%` }}></div>
                    </div>
                  </div>

                  {/* Neutral */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-400">
                      <span className="flex items-center gap-1.5"><Meh className="w-3.5 h-3.5" /> Inquisitive / Neutral</span>
                      <span>{aiReport.sentimentRatio.neutral}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-zinc-500 h-full rounded-full" style={{ width: `${aiReport.sentimentRatio.neutral}%` }}></div>
                    </div>
                  </div>

                  {/* Negative */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5 text-amber-500">
                      <span className="flex items-center gap-1.5"><Frown className="w-3.5 h-3.5" /> Criticism / Demands</span>
                      <span>{aiReport.sentimentRatio.negative}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${aiReport.sentimentRatio.negative}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recurring Key Themes */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" /> Primary Core Themes &amp; Feedback
                </h5>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                  {aiReport.keyThemes.map((theme, idx) => (
                    <li key={idx} className="flex gap-3 items-start bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-extrabold font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Questions */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> Community Questions Identified
                </h5>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                  {aiReport.userQuestions.map((question, idx) => (
                    <li key={idx} className="flex gap-3 items-start bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-extrabold font-mono text-[10px]">
                        Q
                      </span>
                      <span className="italic leading-relaxed">"{question}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Creator Response Strategy */}
              <div className="bg-gradient-to-br from-brand-red/5 to-brand-purple/5 border border-brand-red/10 rounded-2xl p-5 space-y-2.5">
                <h5 className="text-[10px] font-extrabold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-red" /> Suggested Response Strategy
                </h5>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {aiReport.creatorResponseStrategy}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-xs text-center p-6">
              <Sparkles className="w-12 h-12 stroke-[1.2] mx-auto mb-3 text-zinc-700 animate-pulse" />
              <p className="font-bold text-zinc-400">No Sentiment Analysis Generated</p>
              <p className="text-zinc-600 mt-1.5 max-w-xs leading-relaxed">
                Click "Analyze Sentiment" above to query the dynamic AI engine to audit your community thread!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
