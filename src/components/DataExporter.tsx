import React, { useState } from "react";
import { ChannelProfile, VideoItem } from "../types";
import { Download, FileJson, FileSpreadsheet, Clipboard, CheckCircle2, ShieldCheck, Database } from "lucide-react";

interface DataExporterProps {
  channel: ChannelProfile;
  videos: VideoItem[];
}

export default function DataExporter({ channel, videos }: DataExporterProps) {
  const [exportingType, setExportingType] = useState<"json" | "csv" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const triggerDownload = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = (dataset: "profile" | "videos") => {
    const data = dataset === "profile" ? channel : videos;
    const jsonStr = JSON.stringify(data, null, 2);
    triggerDownload(jsonStr, `${channel.snippet.title.replace(/\s+/g, "_")}_${dataset}.json`, "application/json");
    showNotification("JSON Export completed successfully!");
  };

  const handleExportCSV = () => {
    if (videos.length === 0) return;
    
    // Headers
    const headers = ["Video ID", "Title", "Published At", "Duration", "Views", "Likes", "Comments", "Engagement Rate (%)"];
    
    // Rows
    const rows = videos.map((v) => {
      const engRate = v.viewCount > 0 ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0;
      return [
        v.id,
        `"${v.title.replace(/"/g, '""')}"`,
        v.publishedAt,
        v.duration,
        v.viewCount,
        v.likeCount,
        v.commentCount,
        engRate.toFixed(2)
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    triggerDownload(csvContent, `${channel.snippet.title.replace(/\s+/g, "_")}_videos.csv`, "text/csv;charset=utf-8;");
    showNotification("CSV Export completed successfully!");
  };

  const handleCopyToClipboard = (dataset: "profile" | "videos") => {
    const data = dataset === "profile" ? channel : videos;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showNotification("Dataset copied to clipboard!");
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6" id="data-exporter">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.04]">
        <h3 className="font-display font-bold text-white text-base mb-1 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-red animate-pulse" /> Data Export &amp; SQLite Schema Engine
        </h3>
        <p className="text-xs text-gray-400">Save, export, or pipe compiled YouTube profiles and video metrics datasets.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4.5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Export Card */}
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.02] flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <FileJson className="w-4.5 h-4.5 text-indigo-400" /> Channel Profile Dataset
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Includes full subscriber milestone levels, view aggregates, descriptions, banner layouts, custom handles, and countries.
            </p>
            
            <div className="bg-zinc-950/40 rounded-xl p-3 border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
              <p>• Size: ~5 KB JSON data packet</p>
              <p>• Rows: 1 structured profile record</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              onClick={() => handleExportJSON("profile")}
              className="px-3 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/60 text-zinc-200 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
            <button
              type="button"
              onClick={() => handleCopyToClipboard("profile")}
              className="px-3 py-2.5 bg-gradient-to-r from-brand-red to-brand-purple hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Clipboard className="w-3.5 h-3.5" /> Copy Dataset
            </button>
          </div>
        </div>

        {/* Video Performance Dataset */}
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.02] flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-400" /> Video Performance Feed
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Structured catalog of recently crawled uploads, compiling lifetime video views, comment quantities, publish times, like indexes, and calculated interaction rates.
            </p>
            
            <div className="bg-zinc-950/40 rounded-xl p-3 border border-white/5 font-mono text-[11px] text-zinc-400 space-y-1">
              <p>• Size: ~30 KB CSV/JSON packet</p>
              <p>• Records: {videos.length} videos resolved</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <button
              type="button"
              onClick={() => handleExportJSON("videos")}
              className="px-2.5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/60 text-zinc-200 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" /> JSON
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={videos.length === 0}
              className="px-2.5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/60 text-zinc-200 border border-white/5 hover:border-white/10 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> CSV Sheet
            </button>
            <button
              type="button"
              onClick={() => handleCopyToClipboard("videos")}
              disabled={videos.length === 0}
              className="px-2.5 py-2.5 bg-gradient-to-r from-brand-red to-brand-purple hover:opacity-95 text-white disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md"
            >
              <Clipboard className="w-3.5 h-3.5" /> Copy Data
            </button>
          </div>
        </div>
      </div>

      {/* Structured Schema Info Card */}
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/[0.02]">
        <h4 className="font-display font-bold text-white text-sm mb-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-brand-red" /> DB Pipeline Schematics (SQLite / Postgres)
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          To integrate these datasets into local databases, use the following pre-compiled table structures.
        </p>

        <pre className="bg-zinc-950/80 border border-white/5 p-4 rounded-xl text-[10px] font-mono text-zinc-400 overflow-x-auto leading-relaxed shadow-inner">
{`CREATE TABLE youtube_channels (
  channel_id VARCHAR(24) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  custom_url VARCHAR(100),
  subscribers BIGINT DEFAULT 0,
  lifetime_views BIGINT DEFAULT 0,
  video_count INT DEFAULT 0,
  joined_date DATE
);

CREATE TABLE youtube_videos (
  video_id VARCHAR(11) PRIMARY KEY,
  channel_id VARCHAR(24) REFERENCES youtube_channels(channel_id),
  title VARCHAR(255) NOT NULL,
  publish_time TIMESTAMP,
  views BIGINT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  duration_string VARCHAR(20)
);`}
        </pre>
      </div>
    </div>
  );
}
