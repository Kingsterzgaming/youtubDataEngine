import React, { useState, useEffect } from "react";
import { Key, CheckCircle, AlertTriangle, ExternalLink, ShieldCheck, Cpu, Sparkles, Loader2, Info, X, Palette, Check } from "lucide-react";
import { getAiHeaders } from "../lib/aiConfig";
import { THEME_LIBRARY, ThemeDefinition } from "../lib/themes";

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onVerify: () => Promise<boolean>;
  onClose?: () => void;
  activeThemeId: string;
  onThemeChange: (id: string) => void;
}

export default function SettingsPanel({ apiKey, setApiKey, onClose, activeThemeId, onThemeChange }: SettingsPanelProps) {
  // YouTube Data API Key
  const [ytInputKey, setYtInputKey] = useState(apiKey);
  const [ytVerifying, setYtVerifying] = useState(false);
  const [ytStatus, setYtStatus] = useState<"idle" | "success" | "error">("idle");
  const [ytStatusMsg, setYtStatusMsg] = useState("");

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("yt_data_engine_ai_provider") || "auto");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("yt_data_engine_gemini_key") || "");
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem("yt_data_engine_openai_key") || "");
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem("yt_data_engine_anthropic_key") || "");

  // AI Connection Verification state
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiStatusMsg, setAiStatusMsg] = useState("");

  useEffect(() => {
    setYtInputKey(apiKey);
  }, [apiKey]);

  // Handle saving and verifying YouTube API key
  const handleSaveYouTubeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ytInputKey.trim();
    setApiKey(trimmed);
    localStorage.setItem("yt_data_engine_key", trimmed);
    
    setYtVerifying(true);
    setYtStatus("idle");
    setYtStatusMsg("");

    try {
      const res = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-youtube-api-key": trimmed
        },
        body: JSON.stringify({ input: "@YouTube" })
      });

      if (res.ok) {
        setYtStatus("success");
        setYtStatusMsg("API Key successfully validated with YouTube Data API v3!");
      } else {
        const errData = await res.json();
        setYtStatus("error");
        setYtStatusMsg(errData.error || "Failed to validate API Key. Please verify and try again.");
      }
    } catch (err: any) {
      setYtStatus("error");
      setYtStatusMsg(err.message || "Network error validating key.");
    } finally {
      setYtVerifying(false);
    }
  };

  // Handle saving and verifying AI Agent configs
  const handleSaveAndVerifyAI = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to local storage first
    localStorage.setItem("yt_data_engine_ai_provider", aiProvider);
    localStorage.setItem("yt_data_engine_gemini_key", geminiKey.trim());
    localStorage.setItem("yt_data_engine_openai_key", openaiKey.trim());
    localStorage.setItem("yt_data_engine_anthropic_key", anthropicKey.trim());

    setAiVerifying(true);
    setAiStatus("idle");
    setAiStatusMsg("");

    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: getAiHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setAiStatus("success");
        const resolvedProviderName = 
          data.provider === "gemini" ? "Google Gemini" :
          data.provider === "openai" ? "OpenAI (GPT-4o-mini)" : 
          data.provider === "anthropic" ? "Anthropic (Claude-3.5)" : data.provider;
        
        setAiStatusMsg(`AI test succeeded! Running smoothly on ${resolvedProviderName}.`);
      } else {
        const errData = await res.json();
        setAiStatus("error");
        setAiStatusMsg(errData.error || "Failed to establish completion test with selected AI configuration.");
      }
    } catch (err: any) {
      setAiStatus("error");
      setAiStatusMsg(err.message || "Network error validating AI keys.");
    } finally {
      setAiVerifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in" id="settings-panel">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-brand-red animate-pulse" />
            System Configuration
          </h2>
          <p className="text-sm text-zinc-400">
            Configure API credentials, customize third-party AI agents, and manage priority completion fallbacks.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer self-start sm:self-center"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Configurations */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1: YouTube Data API Credentials */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-red"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red border border-brand-red/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">YouTube Data API v3</h3>
                <p className="text-xs text-zinc-400">Proxies analytics feeding and public channel searches</p>
              </div>
            </div>

            <form onSubmit={handleSaveYouTubeKey} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  API Key String
                </label>
                <input
                  type="password"
                  value={ytInputKey}
                  onChange={(e) => setYtInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-brand-red/40 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-2.5 leading-relaxed">
                  Your credentials are saved strictly inside your local browser cache and are only transmitted to query YouTube metrics.
                </p>
              </div>

              <button
                type="submit"
                disabled={ytVerifying}
                className="w-full bg-brand-red hover:bg-brand-red-hover text-white text-xs sm:text-sm font-bold rounded-xl py-3.5 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-brand-red/10"
              >
                {ytVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Connection...
                  </>
                ) : (
                  "Save & Verify YouTube Connection"
                )}
              </button>
            </form>

            {/* YouTube Verification Results */}
            {ytStatus !== "idle" && (
              <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 border ${
                ytStatus === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                {ytStatus === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">{ytStatus === "success" ? "YouTube Connection Verified" : "Verification Failed"}</p>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">{ytStatusMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: AI Agent & Multi-Model Engine Setup */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">AI Agent Intelligence Setup</h3>
                <p className="text-xs text-zinc-400">Configure LLM providers, credentials, and custom completion engines</p>
              </div>
            </div>

            <form onSubmit={handleSaveAndVerifyAI} className="space-y-6">
              
              {/* Select AI Provider */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  Active AI Engine
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-indigo-500/40 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all duration-200 font-medium cursor-pointer"
                >
                  <option value="auto">Auto-Select / Priority Fallback (Use any available key)</option>
                  <option value="gemini">Google Gemini (Model: gemini-3.5-flash)</option>
                  <option value="openai">OpenAI (Model: gpt-4o-mini)</option>
                  <option value="anthropic">Anthropic (Model: claude-3-5-sonnet)</option>
                </select>
                <div className="flex items-start gap-1.5 mt-3 text-zinc-500 text-[11px] leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Priority Fallback (Auto)</strong> detects active keys in order: <strong>Gemini ➔ OpenAI ➔ Anthropic</strong>. If your active selection fails or is missing a key, it will auto-fallback to any other populated key!
                  </span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-5 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Provider Credentials</h4>
                
                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-zinc-300">
                      Google Gemini API Key
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Optional fallback to Server Secret</span>
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Auto-configured in cloud (Paste custom key to override)"
                    className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium font-mono"
                  />
                </div>

                {/* OpenAI Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium font-mono"
                  />
                </div>

                {/* Anthropic Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300">
                    Anthropic API Key
                  </label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 outline-none transition-all duration-200 font-medium font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={aiVerifying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl py-3.5 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
              >
                {aiVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing AI Connections...
                  </>
                ) : (
                  "Save & Test AI Engine"
                )}
              </button>
            </form>

            {/* AI Verification Results */}
            {aiStatus !== "idle" && (
              <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 border ${
                aiStatus === "success" 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                {aiStatus === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">{aiStatus === "success" ? "AI Engine Verified" : "AI Verification Failed"}</p>
                  <p className="text-xs opacity-95 mt-1 leading-relaxed">{aiStatusMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Visual Theme Customization */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-red"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red border border-brand-red/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Dashboard Visual Theme Library</h3>
                  <p className="text-xs text-zinc-400">Select an offline theme design to customize layout colors, background and accents</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-white/[0.03] border border-white/5 text-zinc-400 text-[9px] font-bold uppercase rounded-lg self-start sm:self-center">
                Offline Designs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_LIBRARY.map((theme) => {
                const isSelected = theme.id === activeThemeId;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onThemeChange(theme.id)}
                    className={`group text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-36 ${
                      isSelected
                        ? "bg-white/[0.04] border-brand-red shadow-lg shadow-brand-red/5"
                        : "bg-[#09090e]/40 border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
                    }`}
                  >
                    {/* Top part: title + check */}
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-red transition-colors">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center border border-brand-red/30 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 leading-normal line-clamp-2">
                        {theme.description}
                      </p>
                    </div>

                    {/* Bottom part: Color preview bar */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.03] w-full">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-inner shrink-0" style={{ backgroundColor: theme.brandRed }} title="Primary Accent" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-inner shrink-0" style={{ backgroundColor: theme.brandPurple }} title="Secondary Accent" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-inner shrink-0" style={{ backgroundColor: theme.brandCyan }} title="Tertiary Accent" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-inner shrink-0" style={{ backgroundColor: theme.backgroundColor }} title="Base Background" />
                      <span className="text-[9px] text-zinc-500 font-mono font-medium ml-auto uppercase truncate max-w-[80px]">
                        {theme.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Guide & Info */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Cloud Active Info */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-5 shadow-xl">
            <h4 className="font-display font-bold text-white text-xs mb-4 flex items-center gap-2 pb-2 border-b border-white/5">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
              Environment Status
            </h4>
            
            <div className="space-y-4 text-[11px]">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 text-indigo-300 leading-relaxed">
                <span className="font-bold block mb-1">Gemini Server Injection:</span>
                Active and configured via server-side secrets. Even if you do not have personal keys, Gemini will run automatically inside this developer workspace!
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 text-zinc-400 leading-relaxed">
                <span className="font-bold text-zinc-300 block mb-1">Custom Keys Storage:</span>
                All credentials entered here are securely cached on your browser. Our server proxies your requests using the supplied credentials without saving them.
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="glass-card border border-white/[0.04] rounded-2xl p-5 shadow-xl text-xs">
            <h4 className="font-display font-bold text-white text-xs mb-4 pb-2 border-b border-white/5">API Registration Guides:</h4>
            <div className="text-[11px] text-zinc-400 space-y-4">
              <div>
                <span className="font-bold text-zinc-300 block mb-1">YouTube Data API Key:</span>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                  <li>
                    Open{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-red hover:underline inline-flex items-center gap-0.5"
                    >
                      GCP Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Go to API Library and enable "YouTube Data API v3".</li>
                  <li>Create an API Key from the Credentials dashboard.</li>
                </ol>
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="font-bold text-zinc-300 block mb-2.5">Alternative LLM Keys:</span>
                <ul className="space-y-2 pl-1">
                  <li>
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center justify-between"
                    >
                      Google AI Studio Key <ExternalLink className="w-3 h-3 text-indigo-500" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://platform.openai.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center justify-between mt-1"
                    >
                      OpenAI Platform Key <ExternalLink className="w-3 h-3 text-indigo-500" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center justify-between mt-1"
                    >
                      Anthropic Console Key <ExternalLink className="w-3 h-3 text-indigo-500" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
