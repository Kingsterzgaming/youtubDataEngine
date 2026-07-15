import React, { useState } from "react";
import { Search, Sparkles, Youtube, Loader2, Compass, AlertCircle } from "lucide-react";

interface ChannelSearchProps {
  apiKey: string;
  onChannelSelect: (channelId: string, title: string) => void;
}

export default function ChannelSearch({ apiKey, onChannelSelect }: ChannelSearchProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { handle: "@MrBeast", name: "MrBeast" },
    { handle: "@MarquesBrownlee", name: "MKBHD" },
    { handle: "@Veritasium", name: "Veritasium" },
    { handle: "@GoogleDevelopers", name: "Google Devs" },
    { handle: "@Fireship", name: "Fireship" }
  ];

  const handleResolve = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-youtube-api-key": apiKey
        },
        body: JSON.stringify({ input: searchTerm })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("YOUTUBE_API_KEY_MISSING");
        }
        const errData = await res.json();
        throw new Error(errData.error || "Failed to resolve channel. Check the format.");
      }

      const channel = await res.json();
      onChannelSelect(channel.id, channel.title);
    } catch (err: any) {
      console.error(err);
      if (err.message === "YOUTUBE_API_KEY_MISSING") {
        setError("Your YouTube Data API key is missing. Please go to the Settings tab and add your key first.");
      } else {
        setError(err.message || "Could not resolve channel. Make sure the handle/URL is typed correctly.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleResolve(input);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4" id="channel-search">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brand-red/10 to-brand-purple/10 border border-brand-red/20 rounded-full text-brand-red text-xs font-bold mb-5 tracking-wider uppercase shadow-inner">
          <Youtube className="w-4 h-4 animate-pulse text-brand-red" /> YouTube Engine Intelligence
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight mb-5 leading-tight">
          Connect, Load &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-[#ff00a0] to-brand-purple">Analyze</span> Channel Data
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Resolve any channel handle, custom URL, or ID instantly to extract deep statistics, comment sentiment, and predictive AI insights.
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
        <div className="relative flex items-center bg-zinc-950/45 backdrop-blur-md border border-white/[0.06] focus-within:border-brand-red/40 rounded-2xl p-2.5 pl-4.5 transition-all duration-300 shadow-[0_15px_50px_-15px_rgba(255,0,85,0.15)]">
          <Search className="w-5 h-5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Enter Channel (@handle, URL, or Channel ID)..."
            className="w-full bg-transparent border-0 text-white placeholder-zinc-600 outline-none text-sm sm:text-base py-2 px-3 focus:ring-0"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-brand-red to-brand-purple hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm px-6 py-3 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand-red/15 hover:shadow-brand-red/25 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Resolving...
              </>
            ) : (
              <>
                Analyze <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Badges */}
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 mb-8">
        <span className="text-xs text-gray-500 flex items-center gap-1 uppercase tracking-wider mr-1.5 font-bold">
          <Compass className="w-3.5 h-3.5 text-zinc-400" /> Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.handle}
            type="button"
            onClick={() => {
              setInput(p.handle);
              handleResolve(p.handle);
            }}
            disabled={loading}
            className="px-4 py-2 bg-white/[0.02] hover:bg-gradient-to-r hover:from-brand-red/10 hover:to-brand-purple/10 hover:text-white border border-white/5 hover:border-brand-red/30 rounded-full text-xs text-zinc-400 hover:text-zinc-100 transition-all duration-200 cursor-pointer shadow-sm font-semibold"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="max-w-2xl mx-auto mt-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl flex items-start gap-3 text-brand-red">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Failed to load channel</p>
            <p className="opacity-90 mt-1">{error}</p>
          </div>
        </div>
      )}


    </div>
  );
}
