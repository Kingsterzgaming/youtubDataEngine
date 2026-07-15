import React, { useState, useEffect } from "react";
import { ChannelProfile } from "../types";
import { Search, ArrowRightLeft, Users, Eye, Video, Trophy, Calendar, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChannelCompareProps {
  apiKey: string;
  activeChannel: ChannelProfile | null;
}

interface CompareData {
  id: string;
  title: string;
  thumbnail: string;
  customUrl?: string;
  subscribers: number;
  views: number;
  videos: number;
  avgViews: number;
  publishedAt: string;
  description: string;
  country?: string;
}

export default function ChannelCompare({ apiKey, activeChannel }: ChannelCompareProps) {
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  
  const [channelA, setChannelA] = useState<CompareData | null>(null);
  const [channelB, setChannelB] = useState<CompareData | null>(null);
  
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  // Helper to parse channel profiles into CompareData format
  const formatCompareData = (profile: any): CompareData => {
    const subs = parseInt(profile.statistics?.subscriberCount || "0", 10);
    const views = parseInt(profile.statistics?.viewCount || "0", 10);
    const videos = parseInt(profile.statistics?.videoCount || "0", 10);
    return {
      id: profile.id,
      title: profile.snippet?.title || "Unknown Channel",
      thumbnail: profile.snippet?.thumbnails?.default?.url || profile.snippet?.thumbnails?.medium?.url || "",
      customUrl: profile.snippet?.customUrl,
      subscribers: subs,
      views: views,
      videos: videos,
      avgViews: videos > 0 ? Math.round(views / videos) : 0,
      publishedAt: profile.snippet?.publishedAt ? new Date(profile.snippet.publishedAt).toLocaleDateString() : "N/A",
      description: profile.snippet?.description || "",
      country: profile.snippet?.country
    };
  };

  // Pre-populate Channel A if active channel is available
  useEffect(() => {
    if (activeChannel) {
      setChannelA(formatCompareData(activeChannel));
      setQueryA(activeChannel.snippet?.title || "");
    }
  }, [activeChannel]);

  const resolveChannel = async (query: string, setChannel: React.Dispatch<React.SetStateAction<CompareData | null>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (!query.trim()) {
      setError("Please enter a channel name, handle or URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Resolve handle / query to ID
      const resolveRes = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-youtube-api-key": apiKey
        },
        body: JSON.stringify({ input: query.trim() })
      });

      if (!resolveRes.ok) {
        if (resolveRes.status === 401) throw new Error("YOUTUBE_API_KEY_MISSING");
        const err = await resolveRes.json();
        throw new Error(err.error || "Channel resolution failed.");
      }

      const resolved = await resolveRes.json();

      // 2. Fetch full profile with resolved ID
      const profileRes = await fetch(`/api/youtube/channel/${resolved.id}`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.error || "Failed to fetch channel details.");
      }

      const profileData = await profileRes.json();
      setChannel(formatCompareData(profileData));
    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setError("API Key missing or invalid. Set it in top-right Settings.");
      } else {
        setError(err.message || "Failed to load channel details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // Chart data formatting
  const chartData = [
    {
      name: "Subscribers",
      [channelA?.title || "Channel A"]: channelA?.subscribers || 0,
      [channelB?.title || "Channel B"]: channelB?.subscribers || 0
    },
    {
      name: "Videos Uploaded",
      [channelA?.title || "Channel A"]: channelA?.videos || 0,
      [channelB?.title || "Channel B"]: channelB?.videos || 0
    }
  ];

  const viewsChartData = [
    {
      name: "Total Video Views",
      [channelA?.title || "Channel A"]: channelA?.views || 0,
      [channelB?.title || "Channel B"]: channelB?.views || 0
    },
    {
      name: "Avg Views/Video",
      [channelA?.title || "Channel A"]: channelA?.avgViews || 0,
      [channelB?.title || "Channel B"]: channelB?.avgViews || 0
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="channel-compare-panel">
      {/* Header section */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-brand-purple animate-pulse" />
          Channel Intelligence Matchup
        </h2>
        <p className="text-sm text-zinc-400">
          Compare subscriber tiers, viewership momentum, and upload frequencies side-by-side.
        </p>
      </div>

      {/* Input Selection grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Channel A */}
        <div className="glass-card border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-red"></div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-3">
            Primary Channel (A)
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. @MrBeast or URL"
              value={queryA}
              onChange={(e) => setQueryA(e.target.value)}
              className="flex-1 bg-[#0c0c0e]/60 border border-white/5 focus:border-brand-red/40 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium"
            />
            <button
              onClick={() => resolveChannel(queryA, setChannelA, setLoadingA, setErrorA)}
              disabled={loadingA}
              className="px-5 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loadingA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Compare
            </button>
          </div>
          {errorA && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-red">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorA}</span>
            </div>
          )}

          {/* Render Channel A quick Preview */}
          {channelA && (
            <div className="mt-5 flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <img src={channelA.thumbnail} alt={channelA.title} className="w-12 h-12 rounded-full border border-brand-red/30 object-cover" referrerPolicy="no-referrer" />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{channelA.title}</h4>
                <p className="text-xs text-zinc-500 font-medium font-mono">{channelA.customUrl || channelA.id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Channel B */}
        <div className="glass-card border border-white/[0.04] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-purple"></div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-3">
            Competitor Channel (B)
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. @TSeries or URL"
              value={queryB}
              onChange={(e) => setQueryB(e.target.value)}
              className="flex-1 bg-[#0c0c0e]/60 border border-white/5 focus:border-brand-purple/40 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium"
            />
            <button
              onClick={() => resolveChannel(queryB, setChannelB, setLoadingB, setErrorB)}
              disabled={loadingB}
              className="px-5 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loadingB ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Compare
            </button>
          </div>
          {errorB && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-red">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorB}</span>
            </div>
          )}

          {/* Render Channel B quick Preview */}
          {channelB && (
            <div className="mt-5 flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <img src={channelB.thumbnail} alt={channelB.title} className="w-12 h-12 rounded-full border border-brand-purple/30 object-cover" referrerPolicy="no-referrer" />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{channelB.title}</h4>
                <p className="text-xs text-zinc-500 font-medium font-mono">{channelB.customUrl || channelB.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Head-to-head match stats container */}
      {channelA && channelB ? (
        <div className="space-y-8 animate-fade-in">
          {/* Main Key Stats Grid */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2 pb-3 border-b border-white/5">
              <Trophy className="w-5 h-5 text-amber-500" />
              Statistical Matchup Breakdown
            </h3>

            <div className="space-y-6">
              {/* Subscribers Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 border-b border-white/[0.03] gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Subscriber Count</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelA.subscribers)}</span>
                    {channelA.subscribers > channelB.subscribers && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex p-2 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    {channelA.subscribers !== channelB.subscribers ? (
                      channelA.subscribers > channelB.subscribers ? (
                        <>A is {(channelA.subscribers / Math.max(1, channelB.subscribers)).toFixed(1)}x larger</>
                      ) : (
                        <>B is {(channelB.subscribers / Math.max(1, channelA.subscribers)).toFixed(1)}x larger</>
                      )
                    ) : "Evenly Matched"}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Subscriber Count</span>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    {channelB.subscribers > channelA.subscribers && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelB.subscribers)}</span>
                  </div>
                </div>
              </div>

              {/* Total Views Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 border-b border-white/[0.03] gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Total View Count</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelA.views)}</span>
                    {channelA.views > channelB.views && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex p-2 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-500">
                    <Eye className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    {channelA.views !== channelB.views ? (
                      channelA.views > channelB.views ? (
                        <>{formatNumber(channelA.views - channelB.views)} more views</>
                      ) : (
                        <>{formatNumber(channelB.views - channelA.views)} more views</>
                      )
                    ) : "Equal Viewership"}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Total View Count</span>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    {channelB.views > channelA.views && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelB.views)}</span>
                  </div>
                </div>
              </div>

              {/* Videos Published Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 border-b border-white/[0.03] gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Video Catalog Size</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-2xl font-bold font-mono text-zinc-100">{channelA.videos.toLocaleString()}</span>
                    {channelA.videos > channelB.videos && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex p-2 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-500">
                    <Video className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    {channelA.videos !== channelB.videos ? (
                      channelA.videos > channelB.videos ? (
                        <>A has {Math.round(channelA.videos - channelB.videos)} more uploads</>
                      ) : (
                        <>B has {Math.round(channelB.videos - channelA.videos)} more uploads</>
                      )
                    ) : "Identical Upload Count"}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Video Catalog Size</span>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    {channelB.videos > channelA.videos && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                    <span className="text-2xl font-bold font-mono text-zinc-100">{channelB.videos.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Average Views Per Video */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 border-b border-white/[0.03] gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Avg Views per Upload</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelA.avgViews)}</span>
                    {channelA.avgViews > channelB.avgViews && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex p-2 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    {channelA.avgViews !== channelB.avgViews ? (
                      channelA.avgViews > channelB.avgViews ? (
                        <>A is {(channelA.avgViews / Math.max(1, channelB.avgViews)).toFixed(1)}x more active per video</>
                      ) : (
                        <>B is {(channelB.avgViews / Math.max(1, channelA.avgViews)).toFixed(1)}x more active per video</>
                      )
                    ) : "Equal upload weight"}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Avg Views per Upload</span>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    {channelB.avgViews > channelA.avgViews && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase rounded font-sans">Winner</span>
                    )}
                    <span className="text-2xl font-bold font-mono text-zinc-100">{formatNumber(channelB.avgViews)}</span>
                  </div>
                </div>
              </div>

              {/* Account Registration Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 gap-4">
                <div className="text-center md:text-left">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Published On</span>
                  <span className="text-sm font-semibold text-zinc-200">{channelA.publishedAt}</span>
                </div>
                <div className="text-center">
                  <div className="inline-flex p-2 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">Established Lifespan</p>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-1">Published On</span>
                  <span className="text-sm font-semibold text-zinc-200">{channelB.publishedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card border border-white/[0.04] rounded-2xl p-5 shadow-xl">
              <h4 className="font-display font-bold text-white text-xs mb-6 uppercase tracking-wider pb-2 border-b border-white/5">
                Channel Scale comparison (Linear)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c0c0e", borderColor: "rgba(255,255,255,0.08)" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={channelA.title} fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={channelB.title} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card border border-white/[0.04] rounded-2xl p-5 shadow-xl">
              <h4 className="font-display font-bold text-white text-xs mb-6 uppercase tracking-wider pb-2 border-b border-white/5">
                Views &amp; Average Weight Momentum
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c0c0e", borderColor: "rgba(255,255,255,0.08)" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={channelA.title} fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={channelB.title} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card border border-white/[0.04] border-dashed rounded-2xl p-12 text-center text-zinc-500 animate-pulse">
          <ArrowRightLeft className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-display font-bold text-sm mb-1.5">Resolve Channels to Compare</h3>
          <p className="max-w-md mx-auto text-xs text-zinc-500 leading-relaxed">
            Specify handles (e.g. <code className="text-brand-red bg-brand-red/5 px-1 py-0.5 rounded font-mono">@MrBeast</code>), full URLs or IDs for both slots above to generate a high-fidelity intelligence matchup chart.
          </p>
        </div>
      )}
    </div>
  );
}
