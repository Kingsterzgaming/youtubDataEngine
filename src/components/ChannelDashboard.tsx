import React, { useState } from "react";
import { ChannelProfile, VideoItem } from "../types";
import { Users, Eye, Video, MapPin, Calendar, Link as LinkIcon, Info, Sparkles, TrendingUp, HeartHandshake } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";

interface ChannelDashboardProps {
  channel: ChannelProfile;
  videos: VideoItem[];
}

export default function ChannelDashboard({ channel, videos }: ChannelDashboardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  const formatNumber = (num: string | number) => {
    const val = typeof num === "string" ? parseInt(num, 10) : num;
    if (isNaN(val)) return "0";
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + "B";
    if (val >= 1000000) return (val / 1000000).toFixed(2) + "M";
    if (val >= 1000) return (val / 1000).toFixed(1) + "K";
    return val.toString();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Extract variables
  const { snippet, statistics, brandingSettings } = channel;
  const bannerUrl = brandingSettings?.image?.bannerExternalUrl;
  const customUrl = snippet?.customUrl || "";

  // Engagement calculations using actual recent videos
  const avgViews = videos.length > 0 ? videos.reduce((acc, v) => acc + v.viewCount, 0) / videos.length : 0;
  const avgLikes = videos.length > 0 ? videos.reduce((acc, v) => acc + v.likeCount, 0) / videos.length : 0;
  const avgComments = videos.length > 0 ? videos.reduce((acc, v) => acc + v.commentCount, 0) / videos.length : 0;
  
  // Engagement rate = (Avg Likes + Avg Comments) / Avg Views
  const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;

  // Formulate views distribution data for charts
  const viewsChartData = videos
    .slice()
    .reverse()
    .map((v, i) => ({
      index: i + 1,
      title: v.title.length > 15 ? v.title.slice(0, 15) + "..." : v.title,
      views: v.viewCount,
      likes: v.likeCount,
      comments: v.commentCount
    }));

  return (
    <div className="space-y-6" id="channel-dashboard">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 w-full rounded-2xl overflow-hidden border border-zinc-800 bg-[#121216] flex items-center justify-center">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${snippet?.title} Banner`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red/25 via-dark-bg to-zinc-950 flex items-center justify-center">
            <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] absolute inset-0 opacity-40"></div>
            <p className="text-zinc-600 font-display text-sm tracking-wider uppercase font-semibold">Channel Core Analytics Matrix</p>
          </div>
        )}
      </div>

      {/* Profile Header Block */}
      <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 sm:-mt-20 px-4 relative z-10">
        <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-2xl overflow-hidden border-4 border-zinc-950 bg-zinc-900 shadow-2xl shrink-0">
          {snippet?.thumbnails?.high?.url ? (
            <img
              src={snippet.thumbnails.high.url}
              alt={snippet.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white text-4xl font-display font-semibold">
              {snippet?.title?.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="flex-1 md:pt-6 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{snippet?.title}</h1>
            <span className="bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Verified Engine Profile
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-gray-400 mt-2">
            {customUrl && (
              <span className="flex items-center gap-1 text-zinc-300 font-mono">
                <LinkIcon className="w-3.5 h-3.5" /> {customUrl}
              </span>
            )}
            {snippet?.country && (
              <span className="flex items-center gap-1 text-zinc-300">
                <MapPin className="w-3.5 h-3.5" /> {snippet.country}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(snippet?.publishedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Subscribers */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-red/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscribers</span>
            <div className="p-2.5 bg-brand-red/10 rounded-xl text-brand-red group-hover:scale-110 transition-transform duration-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3.5xl font-display font-extrabold text-white leading-none tracking-tight">
            {formatNumber(statistics?.subscriberCount)}
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs mt-3.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Audience Strength</span>
          </div>
        </div>

        {/* Total Views */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-purple/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Reach</span>
            <div className="p-2.5 bg-brand-purple/10 rounded-xl text-brand-purple group-hover:scale-110 transition-transform duration-200">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3.5xl font-display font-extrabold text-white leading-none tracking-tight">
            {formatNumber(statistics?.viewCount)}
          </p>
          <div className="text-zinc-500 text-[10px] mt-4 font-mono font-bold tracking-wider">
            LIFETIME VIEWS ACCUMULATED
          </div>
        </div>

        {/* Video Count */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Count</span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform duration-200">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3.5xl font-display font-extrabold text-white leading-none tracking-tight">
            {formatNumber(statistics?.videoCount)}
          </p>
          <div className="text-zinc-500 text-[10px] mt-4 font-mono font-bold tracking-wider">
            ACTIVE VIDEOS ONLINE
          </div>
        </div>

        {/* AI Engagement Score */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-cyan/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement Rate</span>
            <div className="p-2.5 bg-brand-cyan/10 rounded-xl text-brand-cyan group-hover:scale-110 transition-transform duration-200">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3.5xl font-display font-extrabold text-white leading-none tracking-tight">
            {engagementRate.toFixed(2)}%
          </p>
          <div className="flex items-center gap-1.5 text-brand-cyan text-xs mt-3.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 
            <span>Engine Score</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Visual Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description & Metadata Card */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-zinc-200 font-display font-bold text-sm mb-4 border-b border-white/5 pb-2.5">
              <Info className="w-4.5 h-4.5 text-zinc-400" /> Channel Biography
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {snippet?.description
                ? showFullDesc
                  ? snippet.description
                  : snippet.description.slice(0, 300) + (snippet.description.length > 300 ? "..." : "")
                : "No channel biography available."}
            </p>
            {snippet?.description && snippet.description.length > 300 && (
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-brand-red text-xs font-bold mt-3 hover:text-brand-red-hover hover:underline focus:outline-none cursor-pointer"
              >
                {showFullDesc ? "Read Less" : "Read Full Bio"}
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500 space-y-2.5">
            <div className="flex justify-between items-center">
              <span>Channel ID:</span>
              <span className="font-mono text-zinc-400 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5">{channel.id}</span>
            </div>
            {snippet?.country && (
              <div className="flex justify-between">
                <span>Default Country:</span>
                <span className="text-zinc-400 font-semibold">{snippet.country}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Views Per Video (Recent Avg):</span>
              <span className="text-zinc-400 font-bold">{formatNumber(avgViews)}</span>
            </div>
          </div>
        </div>

        {/* Visual Analytics Recharts Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-zinc-200 font-display font-bold text-sm">
              <TrendingUp className="w-4.5 h-4.5 text-brand-red" /> Video Views Progression
            </div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-extrabold">Last {videos.length} Uploads</span>
          </div>

          {viewsChartData.length > 0 ? (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff0055" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7000ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
                  <XAxis dataKey="index" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(10, 10, 15, 0.95)", borderColor: "rgba(255, 255, 255, 0.08)", borderRadius: "12px", backdropFilter: "blur(8px)" }}
                    labelClassName="text-zinc-400 font-mono text-[11px]"
                    itemStyle={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}
                    formatter={(value: any) => [formatNumber(value), "Views"]}
                  />
                  <Area type="monotone" dataKey="views" stroke="url(#colorViews)" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-600 text-xs">
              <Video className="w-8 h-8 mb-2 stroke-[1.5]" />
              No video views data available. Upload some videos to analyze.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
