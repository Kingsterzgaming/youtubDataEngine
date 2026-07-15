import React, { useState, useEffect } from "react";
import { ChannelProfile, VideoItem } from "./types";
import { THEME_LIBRARY, ThemeDefinition } from "./lib/themes";
import SettingsPanel from "./components/SettingsPanel";
import ChannelSearch from "./components/ChannelSearch";
import ChannelDashboard from "./components/ChannelDashboard";
import VideoAnalytics from "./components/VideoAnalytics";
import CommentAnalyzer from "./components/CommentAnalyzer";
import PlaylistsView from "./components/PlaylistsView";
import AiInsights from "./components/AiInsights";
import ExploreView from "./components/ExploreView";
import DataExporter from "./components/DataExporter";
import ChannelCompare from "./components/ChannelCompare";

import {
  Youtube,
  Compass,
  TrendingUp,
  Video,
  MessageSquare,
  FolderHeart,
  Database,
  Sparkles,
  Key,
  Loader2,
  Menu,
  X,
  LogOut,
  ChevronRight,
  AlertCircle,
  ArrowRightLeft
} from "lucide-react";

type TabType = "dashboard" | "videos" | "comments" | "playlists" | "ai" | "explore" | "settings" | "compare";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  
  // Active Channel Profile
  const [channelId, setChannelId] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [channelProfile, setChannelProfile] = useState<ChannelProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  
  // Loaders
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme customization state
  const [activeThemeId, setActiveThemeId] = useState(() => localStorage.getItem("yt_data_engine_theme_id") || "youtube-red");
  const activeTheme = THEME_LIBRARY.find((t) => t.id === activeThemeId) || THEME_LIBRARY[0];

  const handleThemeChange = (themeId: string) => {
    setActiveThemeId(themeId);
    localStorage.setItem("yt_data_engine_theme_id", themeId);
  };

  // 1. Initial configuration check
  useEffect(() => {
    const savedKey = localStorage.getItem("yt_data_engine_key") || "";
    setApiKey(savedKey);
    
    // Check if we have an active channel already in localStorage to restore session
    const savedChannelId = localStorage.getItem("yt_data_engine_active_channel_id") || "";
    const savedChannelTitle = localStorage.getItem("yt_data_engine_active_channel_title") || "";
    if (savedChannelId && savedChannelTitle) {
      setChannelId(savedChannelId);
      setChannelTitle(savedChannelTitle);
      setActiveTab("dashboard");
    }
  }, []);

  // 2. Fetch full profile and videos whenever active channel changes
  useEffect(() => {
    if (channelId) {
      fetchChannelDetails(channelId);
    }
  }, [channelId, apiKey]);

  const fetchChannelDetails = async (cid: string) => {
    setLoadingChannel(true);
    setGlobalError(null);
    setChannelProfile(null);
    setVideos([]);

    try {
      // Step A: Fetch Channel Statistics and Snippet
      const profileRes = await fetch(`/api/youtube/channel/${cid}`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          throw new Error("YOUTUBE_API_KEY_MISSING");
        }
        const err = await profileRes.json();
        throw new Error(err.error || "Failed to load channel details.");
      }

      const profileData = await profileRes.json();
      setChannelProfile(profileData);

      // Step B: Fetch channel recent videos
      const videosRes = await fetch(`/api/youtube/channel/${cid}/videos?limit=30`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      } else {
        console.warn("Could not load recent videos catalog.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setGlobalError("YouTube Data API credentials not configured. Please add your Key in Settings.");
        setActiveTab("settings");
      } else {
        setGlobalError(err.message || "An error occurred retrieving channel records.");
      }
    } finally {
      setLoadingChannel(false);
    }
  };

  const handleChannelSelect = (cid: string, title: string) => {
    setChannelId(cid);
    setChannelTitle(title);
    localStorage.setItem("yt_data_engine_active_channel_id", cid);
    localStorage.setItem("yt_data_engine_active_channel_title", title);
    setActiveTab("dashboard");
  };

  const handleClearChannel = () => {
    setChannelId("");
    setChannelTitle("");
    setChannelProfile(null);
    setVideos([]);
    localStorage.removeItem("yt_data_engine_active_channel_id");
    localStorage.removeItem("yt_data_engine_active_channel_title");
    setActiveTab("explore");
  };

  const activeThemeStyle = {
    "--color-brand-red": activeTheme.brandRed,
    "--color-brand-red-hover": activeTheme.brandRedHover,
    "--color-brand-purple": activeTheme.brandPurple,
    "--color-brand-cyan": activeTheme.brandCyan,
    "--color-dark-bg": activeTheme.backgroundColor,
    "backgroundColor": activeTheme.backgroundColor,
    backgroundImage: `
      radial-gradient(at 0% 0%, ${activeTheme.glow1} 0px, transparent 45%),
      radial-gradient(at 100% 100%, ${activeTheme.glow2} 0px, transparent 45%),
      radial-gradient(at 50% 50%, ${activeTheme.glow3} 0px, transparent 65%)
    `,
    backgroundAttachment: "fixed"
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen text-zinc-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden" 
      id="app-container"
      style={activeThemeStyle}
    >
      
      {/* Dynamic Background Aurora Glows */}
      <div 
        className="fixed top-[-5%] left-[-5%] w-[45vw] h-[45vh] rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" 
        style={{ backgroundColor: activeTheme.brandRed, opacity: 0.06 }}
      />
      <div 
        className="fixed bottom-[-5%] right-[-5%] w-[45vw] h-[45vh] rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow" 
        style={{ backgroundColor: activeTheme.brandPurple, opacity: 0.06, animationDelay: "-3s" }} 
      />

      {/* -------------------------------------- */}
      {/* DESKTOP SIDEBAR NAVIGATION */}
      {/* -------------------------------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#09090e]/80 backdrop-blur-xl border-r border-zinc-900/80 shrink-0 h-screen sticky top-0 justify-between p-5 z-20">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-brand-purple flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-red/20 relative group overflow-hidden">
              <span className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Youtube className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-display font-extrabold tracking-tight text-white leading-none">YouTube Engine</h2>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest mt-1 block">DATA-INTELLIGENCE</span>
            </div>
          </div>

          {/* Active Profile context summary */}
          {channelId ? (
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-2.5 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-zinc-800 ring-2 ring-brand-red/30">
                  {channelProfile?.snippet?.thumbnails?.default?.url ? (
                    <img src={channelProfile.snippet.thumbnails.default.url} alt={channelTitle} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-brand-red">
                      {channelTitle.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">{channelTitle}</h4>
                  <p className="text-[10px] text-zinc-500 truncate font-mono">{channelId}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearChannel}
                className="w-full py-2 bg-white/[0.04] hover:bg-brand-red/10 hover:text-brand-red text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          ) : (
            <div className="p-4 bg-white/[0.01] border border-white/[0.04] border-dashed rounded-xl text-center">
              <p className="text-[11px] text-zinc-500 leading-normal">No active channel profile loaded.</p>
              <button
                type="button"
                onClick={() => setActiveTab("explore")}
                className="text-[10px] font-bold text-brand-red hover:text-brand-red-hover mt-1.5 cursor-pointer inline-flex items-center gap-0.5"
              >
                Discover Channels <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Navigation links */}
          <nav className="space-y-1.5">
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Navigation</span>
            
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "explore" 
                  ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Compass className="w-4 h-4" /> Resolve &amp; Explore
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("compare")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "compare" 
                  ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> Compare Channels
            </button>

            {channelId && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "dashboard" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Profile Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("videos")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "videos" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Video className="w-4 h-4" /> Video Analytics
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("comments")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "comments" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Community Sentiment
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("playlists")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "playlists" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <FolderHeart className="w-4 h-4" /> Playlists Directory
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "ai" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-pink-400" /> AI Insights Layer
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("database")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === "database" 
                      ? "bg-gradient-to-r from-brand-red to-brand-purple text-white shadow-md shadow-brand-red/15" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Database className="w-4 h-4" /> Export Data
                </button>
              </>
            )}
          </nav>
        </div>

      </aside>

      {/* -------------------------------------- */}
      {/* MOBILE HEADER & NAVIGATION DRAWER */}
      {/* -------------------------------------- */}
      <header className="md:hidden bg-[#09090e]/95 backdrop-blur-md border-b border-zinc-900/80 p-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-red to-brand-purple flex items-center justify-center text-white shadow-md">
            <Youtube className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-display font-bold text-white tracking-tight">YouTube Engine</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile top-right Settings trigger */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-brand-red/10 border border-brand-red/25 text-brand-red"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
            title="Settings & API Key"
          >
            <Key className="w-4.5 h-4.5 text-brand-red" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu modal backdrop drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#09090e]/95 backdrop-blur-xl border-b border-zinc-900 p-4 shadow-2xl flex flex-col gap-1.5 animate-slide-down">
            <button
              type="button"
              onClick={() => { setActiveTab("explore"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                activeTab === "explore" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
              }`}
            >
              <Compass className="w-4 h-4" /> Resolve &amp; Explore
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("compare"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                activeTab === "compare" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> Compare Channels
            </button>

            {channelId && (
              <>
                <button
                  type="button"
                  onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "dashboard" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Profile Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("videos"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "videos" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <Video className="w-4 h-4" /> Video Analytics
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("comments"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "comments" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Community Sentiment
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("playlists"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "playlists" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <FolderHeart className="w-4 h-4" /> Playlists Directory
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("ai"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "ai" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> AI Insights Layer
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("database"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold ${
                    activeTab === "database" ? "bg-gradient-to-r from-brand-red to-brand-purple text-white" : "text-zinc-400"
                  }`}
                >
                  <Database className="w-4 h-4" /> Export Data
                </button>

                <button
                  type="button"
                  onClick={() => { handleClearChannel(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold border border-dashed mt-2 ${
                activeTab === "settings" ? "bg-[#12121c] text-white border-brand-red/40" : "text-zinc-400 border-white/5"
              }`}
            >
              <Key className="w-4 h-4 text-brand-red" /> Settings &amp; API Key
            </button>
          </div>
        )}
      </header>

      {/* -------------------------------------- */}
      {/* MAIN VIEWPORT PORT STAGE */}
      {/* -------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Top bar on Desktop */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-[#06060a]/40 backdrop-blur-md border-b border-white/[0.02] gap-4 shrink-0 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-[11px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="font-bold font-mono tracking-wide">{apiKey ? "API KEY CONFIGURED" : "NO API KEY"}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              activeTab === "settings"
                ? "bg-brand-red text-white border-brand-red/20 shadow-md shadow-brand-red/15"
                : "bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-brand-red" />
            Settings &amp; API Key
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 md:max-w-7xl mx-auto w-full relative z-10">
        {/* Loading Channel Screen Overlay */}
        {loadingChannel ? (
          <div className="h-96 flex flex-col items-center justify-center text-zinc-500 text-xs">
            <Loader2 className="w-10 h-10 animate-spin text-brand-red mb-3" />
            <h3 className="text-zinc-300 font-display font-semibold text-sm mb-1">Crawling Channel Profiles</h3>
            <p className="max-w-xs text-center opacity-85 leading-normal">
              Resolving identifiers, mapping playlist entries, and fetching rich performance metrics directly from YouTube...
            </p>
          </div>
        ) : globalError ? (
          <div className="bg-brand-red/10 border border-brand-red/25 rounded-xl p-4 flex items-start gap-3 text-brand-red mb-6 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold">Crawling Failed</p>
              <p className="opacity-90 mt-1">{globalError}</p>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="text-white font-semibold underline mt-2 text-xs focus:outline-none cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {/* View Switches */}
        {!loadingChannel && (
          <div className="animate-fade-in">
            {/* Resolve & Explore */}
            {activeTab === "explore" && (
              <div className="space-y-12">
                <ChannelSearch apiKey={apiKey} onChannelSelect={handleChannelSelect} />
                <ExploreView apiKey={apiKey} onChannelSelect={handleChannelSelect} />
              </div>
            )}

            {/* Profile Dashboard */}
            {activeTab === "dashboard" && channelProfile && (
              <ChannelDashboard channel={channelProfile} videos={videos} />
            )}

            {/* Video Analytics */}
            {activeTab === "videos" && videos.length > 0 && (
              <VideoAnalytics videos={videos} />
            )}

            {/* Community Sentiment */}
            {activeTab === "comments" && videos.length > 0 && (
              <CommentAnalyzer apiKey={apiKey} videos={videos} />
            )}

            {/* Playlists Directory */}
            {activeTab === "playlists" && channelId && (
              <PlaylistsView apiKey={apiKey} channelId={channelId} />
            )}

            {/* AI Insights Layer */}
            {activeTab === "ai" && channelProfile && (
              <AiInsights channel={channelProfile} videos={videos} />
            )}

            {/* Export Data */}
            {activeTab === "database" && channelProfile && (
              <DataExporter channel={channelProfile} videos={videos} />
            )}

            {/* Compare Channels */}
            {activeTab === "compare" && (
              <ChannelCompare apiKey={apiKey} activeChannel={channelProfile} />
            )}

            {/* System Configuration */}
            {activeTab === "settings" && (
              <SettingsPanel
                apiKey={apiKey}
                setApiKey={(key) => setApiKey(key)}
                onVerify={async () => true}
                onClose={() => setActiveTab(channelId ? "dashboard" : "explore")}
                activeThemeId={activeThemeId}
                onThemeChange={handleThemeChange}
              />
            )}
          </div>
        )}

        {/* Footer Accent */}
        <footer className="mt-16 pt-8 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-medium" id="app-footer">
          <div>
            <span>&copy; 2026 </span>
            <span className="text-zinc-400 font-semibold font-display">Kingsterz Gaming</span>
            <span>. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red/40 animate-pulse" />
            <span className="font-mono tracking-wider uppercase text-[9px] text-zinc-600">YouTube Intelligence Engine</span>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
}
