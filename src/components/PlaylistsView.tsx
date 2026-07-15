import React, { useState, useEffect } from "react";
import { PlaylistItem } from "../types";
import { FolderHeart, Video, Calendar, Loader2, AlertCircle, Eye } from "lucide-react";

interface PlaylistsViewProps {
  apiKey: string;
  channelId: string;
}

export default function PlaylistsView({ apiKey, channelId }: PlaylistsViewProps) {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channelId) {
      fetchPlaylists();
    }
  }, [channelId]);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    setPlaylists([]);

    try {
      const res = await fetch(`/api/youtube/channel/${channelId}/playlists`, {
        headers: {
          "x-youtube-api-key": apiKey
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("YOUTUBE_API_KEY_MISSING");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to load channel playlists.");
      }

      const data = await res.json();
      setPlaylists(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setError("Your YouTube Data API key is missing. Go to Settings to configure.");
      } else {
        setError(err.message || "Failed to load playlists.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });
  };

  return (
    <div className="space-y-6" id="playlists-view">
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.04]">
        <h3 className="font-display font-bold text-white text-base mb-1.5 flex items-center gap-2">
          <FolderHeart className="w-5 h-5 text-brand-red" /> Playlists Directory
        </h3>
        <p className="text-xs text-gray-400">View and explore playlists curated by this creator.</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-500 text-xs">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-red" />
          <p className="font-semibold text-zinc-400">Loading playlists database...</p>
        </div>
      ) : error ? (
        <div className="py-12 p-6 bg-brand-red/10 border border-brand-red/20 rounded-2xl flex flex-col items-center justify-center text-center text-brand-red">
          <AlertCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
          <p className="font-semibold">Failed to load playlists</p>
          <p className="text-xs opacity-90 mt-1 max-w-xs">{error}</p>
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-lg border border-white/[0.02] transition-all duration-300 group flex flex-col justify-between">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden border-b border-white/5">
                {playlist.thumbnails?.high?.url ? (
                  <img
                    src={playlist.thumbnails.high.url}
                    alt={playlist.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                )}
                {/* Videos Count Badge Overlaid */}
                <div className="absolute top-0 right-0 bottom-0 w-2/5 bg-black/85 backdrop-blur-sm border-l border-white/5 flex flex-col items-center justify-center text-white">
                  <Video className="w-5 h-5 mb-1.5 text-brand-red" />
                  <span className="font-mono font-extrabold text-lg">{playlist.videoCount}</span>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold mt-0.5">Videos</span>
                </div>
              </div>

              {/* Text */}
              <div className="p-4.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-bold text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
                    {playlist.title}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                    {playlist.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-5 pt-3.5 border-t border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Created {formatDate(playlist.publishedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center border border-white/[0.02]">
          <FolderHeart className="w-12 h-12 stroke-[1.2] mx-auto mb-4.5 text-zinc-600" />
          <p className="font-bold text-zinc-400">No playlists found</p>
          <p className="text-xs text-zinc-600 mt-1.5">This creator does not have any public playlists listed.</p>
        </div>
      )}
    </div>
  );
}
