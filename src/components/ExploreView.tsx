import React, { useState } from "react";
import { SearchResult } from "../types";
import { Search, Compass, Youtube, Eye, FolderOpen, Video, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface ExploreViewProps {
  apiKey: string;
  onChannelSelect: (channelId: string, title: string) => void;
}

export default function ExploreView({ apiKey, onChannelSelect }: ExploreViewProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"video,channel,playlist" | "channel" | "video" | "playlist">("video,channel,playlist");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("YOUTUBE_API_KEY_MISSING");
        }
        const err = await res.json();
        throw new Error(err.error || "Search failed.");
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setError("Your YouTube Data API key is missing. Go to Settings to configure.");
      } else {
        setError(err.message || "Something went wrong during search.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6" id="explore-view">
      {/* Header and Search Form */}
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.04]">
        <h3 className="font-display font-bold text-white text-base mb-1.5 flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-red animate-pulse" /> Search &amp; Discovery Hub
        </h3>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">Query YouTube's global database to discover and load new channel profiles.</p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 flex items-center bg-zinc-950/40 border border-white/5 focus-within:border-brand-red/40 rounded-xl px-4 py-2.5 transition-all">
              <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search channels, topics, keyword niches..."
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
              />
            </div>

            <div className="flex gap-2.5">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-300 outline-none focus:border-brand-red/40 cursor-pointer shrink-0 font-semibold"
              >
                <option value="video,channel,playlist">All Types</option>
                <option value="channel">Channels Only</option>
                <option value="video">Videos Only</option>
                <option value="playlist">Playlists Only</option>
              </select>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-brand-red to-brand-purple hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md hover:shadow-brand-red/10 active:scale-98"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Errors */}
      {error && (
        <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Search Failed</p>
            <p className="opacity-95 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Search results list */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-500 text-xs">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-red" />
          <p className="font-semibold text-zinc-400">Scanning YouTube database...</p>
          <p className="text-zinc-600 mt-1">Extracting high-authority indexing nodes...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((item) => (
            <div key={item.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden p-5 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between group border border-white/[0.02]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                {/* Thumbnail */}
                <div className={`relative aspect-video w-full sm:w-36 rounded-xl overflow-hidden shrink-0 bg-zinc-950 flex items-center justify-center border border-white/5 ${item.type === "channel" ? "rounded-full !w-16 !h-16 aspect-square sm:mx-4" : ""}`}>
                  {item.thumbnails?.medium?.url ? (
                    <img
                      src={item.thumbnails.medium.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-zinc-600 font-bold">{item.type.slice(0, 1).toUpperCase()}</div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.type === "channel" && <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {item.type === "video" && <Video className="w-3.5 h-3.5 text-brand-red shrink-0" />}
                    {item.type === "playlist" && <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">{item.type}</span>
                  </div>

                  <h4 className="font-display font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-brand-red transition-colors" dangerouslySetInnerHTML={{ __html: item.title }} />
                  
                  <p className="text-xs text-zinc-500 line-clamp-1">
                    Channel: <span className="text-zinc-300 font-bold">{item.channelTitle}</span> • Published {formatDate(item.publishedAt)}
                  </p>

                  <p className="text-xs text-zinc-400 line-clamp-2 pt-1 max-w-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: item.description }} />
                </div>
              </div>

              {/* Loader Button */}
              <div className="shrink-0 flex items-end sm:items-center justify-end pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 mt-4 sm:mt-0">
                {item.type === "channel" ? (
                  <button
                    type="button"
                    onClick={() => onChannelSelect(item.id, item.title)}
                    className="bg-brand-red/10 border border-brand-red/25 text-brand-red hover:bg-gradient-to-r hover:from-brand-red hover:to-brand-purple hover:text-white hover:border-transparent text-xs font-bold px-4.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                  >
                    Load Profile <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Fetch the channel of this video/playlist!
                      // For simplicity, we search for the channel name to resolve its ID!
                      onChannelSelect(item.channelTitle, item.channelTitle);
                    }}
                    className="bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 text-xs font-bold px-4.5 py-2.5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-200 flex items-center gap-1.5"
                  >
                    Inspect Channel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="glass-card rounded-2xl py-24 text-center border border-white/[0.02]">
            <Compass className="w-12 h-12 stroke-[1.2] mx-auto mb-4.5 text-zinc-700" />
            <p className="font-bold text-zinc-400">Discover YouTube content creators</p>
            <p className="text-xs text-zinc-600 mt-2 max-w-sm mx-auto leading-relaxed">
              Type keywords above to discover relevant channels, playlists, or tutorials, and click "Load Profile" to inspect them.
            </p>
          </div>
        )
      )}
    </div>
  );
}
