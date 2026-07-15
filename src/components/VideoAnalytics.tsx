import React, { useState, useMemo } from "react";
import { VideoItem } from "../types";
import { Eye, ThumbsUp, MessageSquare, SortAsc, SortDesc, Calendar, Clock, BarChart3, Grid, List, Search } from "lucide-react";

interface VideoAnalyticsProps {
  videos: VideoItem[];
}

// ISO 8601 Duration Parser: e.g. PT1H23M45S -> 1:23:45, PT15M33S -> 15:33
export function parseISO8601Duration(duration: string): string {
  if (!duration) return "";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(String(hours));
  }
  parts.push(hours > 0 ? String(minutes).padStart(2, "0") : String(minutes));
  parts.push(String(seconds).padStart(2, "0"));
  return parts.join(":");
}

export default function VideoAnalytics({ videos }: VideoAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "views" | "likes" | "comments" | "engagement">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const formatNumber = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + "B";
    if (val >= 1000000) return (val / 1000000).toFixed(2) + "M";
    if (val >= 1000) return (val / 1000).toFixed(1) + "K";
    return val.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Process sorting & filtering
  const processedVideos = useMemo(() => {
    let result = [...videos];

    // Filter by search
    if (searchTerm.trim()) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(
        (v) => v.title.toLowerCase().includes(lowSearch) || v.description.toLowerCase().includes(lowSearch)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortBy === "date") {
        valA = new Date(a.publishedAt).getTime();
        valB = new Date(b.publishedAt).getTime();
      } else if (sortBy === "views") {
        valA = a.viewCount;
        valB = b.viewCount;
      } else if (sortBy === "likes") {
        valA = a.likeCount;
        valB = b.likeCount;
      } else if (sortBy === "comments") {
        valA = a.commentCount;
        valB = b.commentCount;
      } else if (sortBy === "engagement") {
        const rateA = a.viewCount > 0 ? ((a.likeCount + a.commentCount) / a.viewCount) * 100 : 0;
        const rateB = b.viewCount > 0 ? ((b.likeCount + b.commentCount) / b.viewCount) * 100 : 0;
        valA = rateA;
        valB = rateB;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [videos, searchTerm, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6" id="video-analytics">
      {/* Filters & Header Bar */}
      <div className="glass-card rounded-2xl p-4.5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl border border-white/[0.04]">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs flex items-center bg-zinc-950/40 border border-white/5 focus-within:border-brand-red/40 rounded-xl px-4 py-2.5 transition-all">
          <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recent uploads..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-300 outline-none focus:border-brand-red/40 cursor-pointer font-semibold"
            >
              <option value="date">Publish Date</option>
              <option value="views">Total Views</option>
              <option value="likes">Like Count</option>
              <option value="comments">Comments</option>
              <option value="engagement">Engagement Rate</option>
            </select>
          </div>

          <button
            type="button"
            onClick={toggleSortOrder}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            className="p-2.5 bg-white/[0.02] border border-white/5 hover:border-white/10 text-zinc-400 rounded-xl cursor-pointer hover:bg-white/[0.05] transition-all"
          >
            {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>

          {/* Grid vs List View */}
          <div className="flex bg-zinc-950/40 rounded-xl p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${viewMode === "grid" ? "bg-brand-red text-white shadow-md shadow-brand-red/10" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${viewMode === "list" ? "bg-brand-red text-white shadow-md shadow-brand-red/10" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Videos List/Grid Display */}
      {processedVideos.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedVideos.map((video) => {
              const videoEng = video.viewCount > 0 ? ((video.likeCount + video.commentCount) / video.viewCount) * 100 : 0;
              return (
                <div key={video.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-lg border border-white/[0.02] transition-all duration-300 group flex flex-col justify-between">
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video bg-zinc-950 overflow-hidden border-b border-white/5">
                    {video.thumbnails?.high?.url ? (
                      <img
                        src={video.thumbnails.high.url}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                    )}
                    {/* Duration Badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 text-white font-mono text-[10px] rounded-lg font-semibold tracking-wider flex items-center gap-1 border border-white/10">
                      <Clock className="w-2.5 h-2.5 text-brand-red" />
                      {parseISO8601Duration(video.duration)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-red transition-colors text-sm sm:text-base">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-4.5 pt-3.5 border-t border-white/5 text-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Views</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-200 font-bold mt-1.5">
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatNumber(video.viewCount)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Likes</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-200 font-bold mt-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatNumber(video.likeCount)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Engagement</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-brand-cyan font-bold mt-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-brand-cyan" />
                          <span>{videoEng.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            {processedVideos.map((video) => {
              const videoEng = video.viewCount > 0 ? ((video.likeCount + video.commentCount) / video.viewCount) * 100 : 0;
              return (
                <div key={video.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-5 p-4 group border border-white/[0.02]">
                  {/* Thumbnail Block */}
                  <div className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-white/5">
                    {video.thumbnails?.medium?.url ? (
                      <img
                        src={video.thumbnails.medium.url}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 text-white font-mono text-[10px] rounded-lg font-semibold border border-white/10 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-brand-red" />
                      {parseISO8601Duration(video.duration)}
                    </span>
                  </div>

                  {/* Descriptions Block */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-brand-red transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 pr-4 leading-relaxed">
                      {video.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2.5">
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(video.publishedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative Metrics Block */}
                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0 shrink-0 pr-2">
                    <div className="text-center md:text-right min-w-[75px]">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Views</p>
                      <div className="flex items-center justify-center md:justify-end gap-1 text-sm font-bold text-zinc-200 mt-1.5">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{formatNumber(video.viewCount)}</span>
                      </div>
                    </div>

                    <div className="text-center md:text-right min-w-[75px]">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Likes</p>
                      <div className="flex items-center justify-center md:justify-end gap-1 text-sm font-bold text-zinc-200 mt-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{formatNumber(video.likeCount)}</span>
                      </div>
                    </div>

                    <div className="text-center md:text-right min-w-[75px]">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Engagement</p>
                      <div className="flex items-center justify-center md:justify-end gap-1 text-sm font-bold text-brand-cyan mt-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-brand-cyan" />
                        <span>{videoEng.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center border border-white/[0.02]">
          <Eye className="w-12 h-12 stroke-[1.2] mx-auto mb-4 text-zinc-600" />
          <p className="font-bold text-zinc-400">No videos match your filters</p>
          <p className="text-xs text-zinc-600 mt-1.5">Try resetting your search parameter or select another channel profile.</p>
        </div>
      )}
    </div>
  );
}
