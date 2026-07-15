import React, { useState } from "react";
import { ChannelProfile, VideoItem, AiAuditReport, AiTitleOption, AiGrowthPrediction, AiKeywordAnalysis } from "../types";
import { Sparkles, BarChart2, ShieldAlert, Key, Clipboard, CheckCircle2, TrendingUp, Compass, KeyRound, AlertCircle, Loader2, ListTodo, HelpCircle, Users, Target, ShieldCheck, Layers, Lightbulb, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getAiHeaders } from "../lib/aiConfig";

interface CompetitorProfile {
  name: string;
  tier: string;
  growthLevers: string[];
  strategyToBeat: string;
}

interface ContentStrategyRec {
  strategyName: string;
  rationale: string;
  actionSteps: string[];
}

interface AiCompetitorData {
  nicheType: string;
  competitors: CompetitorProfile[];
  contentStrategyRecommendations: ContentStrategyRec[];
  marketGaps: string[];
}

interface AiInsightsProps {
  channel: ChannelProfile;
  videos: VideoItem[];
}

export default function AiInsights({ channel, videos }: AiInsightsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"audit" | "growth" | "seo" | "titles" | "competitors">("audit");

  // State caches for each tool
  const [auditData, setAuditData] = useState<AiAuditReport | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [growthData, setGrowthData] = useState<AiGrowthPrediction | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [growthError, setGrowthError] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<AiKeywordAnalysis | null>(null);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  const [competitorData, setCompetitorData] = useState<AiCompetitorData | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);

  const [nicheInput, setNicheInput] = useState(channel.snippet.description ? channel.snippet.description.slice(0, 200) : "");
  const [titlesData, setTitlesData] = useState<AiTitleOption[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);

  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);

  // Helper to handle AI API Key Configuration Errors
  const getAiErrorMessage = (err: any) => {
    if (err.message === "NO_AI_KEYS_CONFIGURED" || err.message === "GEMINI_API_KEY_NOT_CONFIGURED" || err.status === 401) {
      return "No AI API Keys are configured. Please open Settings and supply a Google Gemini, OpenAI, or Anthropic credential to run calculations.";
    }
    return err.message || "An error occurred with the AI agent.";
  };

  // 1. Fetch Audit Report
  const handleGenerateAudit = async () => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/ai/analyze-channel", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ channel, videos })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to generate channel audit.");
      }

      const data = await res.json();
      setAuditData(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(getAiErrorMessage(err));
    } finally {
      setLoadingAudit(false);
    }
  };

  // 2. Fetch Growth Predictions
  const handleGenerateGrowth = async () => {
    setLoadingGrowth(true);
    setGrowthError(null);
    try {
      const res = await fetch("/api/ai/growth-predictor", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ statistics: channel.statistics, channelTitle: channel.snippet.title })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to model growth forecasting.");
      }

      const data = await res.json();
      setGrowthData(data);
    } catch (err: any) {
      console.error(err);
      setGrowthError(getAiErrorMessage(err));
    } finally {
      setLoadingGrowth(false);
    }
  };

  // 3. Fetch SEO Metadata KeyTerms
  const handleGenerateSeo = async () => {
    setLoadingSeo(true);
    setSeoError(null);
    try {
      const res = await fetch("/api/ai/keyword-extractor", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ videoMetadata: videos })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze search SEO.");
      }

      const data = await res.json();
      setSeoData(data);
    } catch (err: any) {
      console.error(err);
      setSeoError(getAiErrorMessage(err));
    } finally {
      setLoadingSeo(false);
    }
  };

  // 4. Fetch Viral Title suggestions
  const handleGenerateTitles = async () => {
    setLoadingTitles(true);
    setTitlesError(null);
    const topVideoTitles = videos.slice(0, 5).map((v) => v.title);

    try {
      const res = await fetch("/api/ai/title-generator", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ currentTitles: topVideoTitles, nicheDescription: nicheInput })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to generate viral hooks.");
      }

      const data = await res.json();
      setTitlesData(data);
    } catch (err: any) {
      console.error(err);
      setTitlesError(getAiErrorMessage(err));
    } finally {
      setLoadingTitles(false);
    }
  };

  // 5. Fetch Competitor recommendations & content strategy
  const handleGenerateCompetitors = async () => {
    setLoadingCompetitors(true);
    setCompetitorsError(null);
    try {
      const res = await fetch("/api/ai/competitor-recommendations", {
        method: "POST",
        headers: getAiHeaders(),
        body: JSON.stringify({ channel, videos })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("NO_AI_KEYS_CONFIGURED");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to generate competitor analysis.");
      }

      const data = await res.json();
      setCompetitorData(data);
    } catch (err: any) {
      console.error(err);
      setCompetitorsError(getAiErrorMessage(err));
    } finally {
      setLoadingCompetitors(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTitleIndex(index);
    setTimeout(() => setCopiedTitleIndex(null), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6" id="ai-insights">
      {/* Tab select bar */}
      <div className="flex glass-card border border-white/[0.04] rounded-2xl p-1 gap-1 overflow-x-auto shadow-md shrink-0">
        <button
          type="button"
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${activeSubTab === "audit" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          <Sparkles className="w-4 h-4" /> Channel Summarizer
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("growth")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${activeSubTab === "growth" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          <BarChart2 className="w-4 h-4" /> Growth Predictor
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("seo")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${activeSubTab === "seo" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          <Compass className="w-4 h-4" /> Search SEO Optimizer
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("titles")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${activeSubTab === "titles" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          <KeyRound className="w-4 h-4" /> Viral Title Lab
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("competitors")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${activeSubTab === "competitors" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          <Target className="w-4 h-4" /> Competitor Analysis
        </button>
      </div>

      {/* -------------------------------------- */}
      {/* AUDIT & STRATEGY (CHANNEL SUMMARIZER) */}
      {/* -------------------------------------- */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">Channel Summarizer &amp; Content Strategy Audit</h3>
              <p className="text-xs text-gray-400 mt-0.5">Assesses branding clarity, description keywords density, and shapes roadmap suggestions.</p>
            </div>
            {!auditData && (
              <button
                type="button"
                onClick={handleGenerateAudit}
                disabled={loadingAudit}
                className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
              >
                {loadingAudit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Fetching AI Audit...
                  </>
                ) : (
                  <>
                    Generate In-Depth Audit <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {auditError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">AI Generation Blocked</p>
                <p className="opacity-90 mt-1">{auditError}</p>
              </div>
            </div>
          )}

          {auditData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                {/* Channel Audit */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> Executive Channel Audit
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                    {auditData.channelAudit}
                  </p>
                </div>

                {/* Content Strategy */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                    <Compass className="w-4.5 h-4.5 text-brand-red animate-pulse" /> Formats &amp; Storytelling Strategy
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                    {auditData.contentStrategy}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Niche Detection */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                    <KeyRound className="w-4.5 h-4.5 text-indigo-400" /> Niche Opportunity Map
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                    {auditData.nicheAnalysis}
                  </p>
                </div>

                {/* Tactical Actions */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                    <ListTodo className="w-4.5 h-4.5 text-amber-400" /> 5 Tactical Actions
                  </h4>
                  <ul className="space-y-3">
                    {auditData.tacticalRecommendations.map((rec, index) => (
                      <li key={index} className="flex gap-2.5 items-start text-xs sm:text-sm text-zinc-300">
                        <span className="w-5 h-5 rounded bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            !loadingAudit && (
              <div className="glass-card border border-white/[0.02] rounded-2xl py-24 text-center">
                <Sparkles className="w-12 h-12 stroke-[1.2] mx-auto mb-3 text-zinc-600 animate-pulse" />
                <p className="font-bold text-zinc-300">Generate Channel Audit Report</p>
                <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Processes channel descriptions, statistics ratios, and upload catalog metadata to discover opportunities.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* -------------------------------------- */}
      {/* GROWTH SIMULATOR (GROWTH PREDICTOR) */}
      {/* -------------------------------------- */}
      {activeSubTab === "growth" && (
        <div className="space-y-6">
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">Channel Growth &amp; Milestone Simulator</h3>
              <p className="text-xs text-gray-400 mt-0.5">Performs compounding growth modelling comparing conservative vs optimized tracks.</p>
            </div>
            {!growthData && (
              <button
                type="button"
                onClick={handleGenerateGrowth}
                disabled={loadingGrowth}
                className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
              >
                {loadingGrowth ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Modeling Compounding growth...
                  </>
                ) : (
                  <>
                    Model Projections <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {growthError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">AI Modeling Blocked</p>
                <p className="opacity-90 mt-1">{growthError}</p>
              </div>
            </div>
          )}

          {growthData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Line Chart Projections */}
              <div className="lg:col-span-2 glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-400" /> 12-Month Audience Growth Simulation
                </h4>
                
                <div className="h-72 w-full text-zinc-300">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData.projections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.15} />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#06060a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px" }}
                        labelClassName="text-zinc-400 font-mono text-xs font-bold"
                        itemStyle={{ fontSize: "12px" }}
                        formatter={(value: any) => [value.toLocaleString(), "Subscribers"]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                      <Line type="monotone" dataKey="conservative" name="Conservative (Natural)" stroke="#71717a" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="moderate" name="Moderate (Consistency)" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="aggressive" name="Aggressive (Viral)" stroke="#ff0033" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Milestones and Strategy list */}
              <div className="space-y-6">
                {/* Pro Milestone timeline */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400" /> Algorithmic Milestones
                  </h4>

                  <div className="space-y-4">
                    {growthData.milestones.map((m, i) => (
                      <div key={i} className="border-l-2 border-brand-red/20 pl-3.5 py-0.5 relative">
                        <div className="absolute w-2.5 h-2.5 bg-brand-red rounded-full -left-[6px] top-1.5 border border-zinc-950"></div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wide">{m.name}</h5>
                        <p className="text-[10px] text-brand-red font-bold font-mono mt-0.5">{m.timeframe}</p>
                        <p className="text-[11px] text-zinc-400 leading-normal mt-1">{m.requirements}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Strategy */}
                <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                  <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-brand-red" /> Algorithmic Growth Roadmap
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {growthData.growthStrategy}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            !loadingGrowth && (
              <div className="glass-card border border-white/[0.02] rounded-2xl py-24 text-center">
                <BarChart2 className="w-12 h-12 stroke-[1.2] mx-auto mb-3 text-zinc-700 animate-pulse" />
                <p className="font-bold text-zinc-300">Generate Compounding Projections</p>
                <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Models growth compounding curves and calculates timelines for critical milestones (subscriber markers, views thresholds).
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* -------------------------------------- */}
      {/* SEO METADATA (KEYWORD EXTRACTOR) */}
      {/* -------------------------------------- */}
      {activeSubTab === "seo" && (
        <div className="space-y-6">
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">Metadata SEO Search Optimizer</h3>
              <p className="text-xs text-gray-400 mt-0.5">Scours upload metadata, extracting keyword opportunities and generating checklists.</p>
            </div>
            {!seoData && (
              <button
                type="button"
                onClick={handleGenerateSeo}
                disabled={loadingSeo}
                className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
              >
                {loadingSeo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Running SEO audit...
                  </>
                ) : (
                  <>
                    Extract Keywords &amp; Checklist <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {seoError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">AI Extraction Blocked</p>
                <p className="opacity-90 mt-1">{seoError}</p>
              </div>
            </div>
          )}

          {seoData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Keywords Table list */}
              <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-brand-red" /> Extracted High-Value Keywords
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500">
                        <th className="py-3 font-bold uppercase tracking-wider text-[10px]">Keyword Target</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-[10px]">Search Intent</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-[10px] text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {seoData.keywords.map((kw, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 font-mono font-medium text-zinc-200">{kw.keyword}</td>
                          <td className="py-3.5">
                            <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              {kw.intent}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-extrabold text-brand-red text-sm">
                            {(kw.relevanceScore * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action checklist */}
              <div className="glass-card border border-white/[0.02] rounded-2xl p-6 shadow-xl">
                <h4 className="font-display font-bold text-white text-sm border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                  <ListTodo className="w-4.5 h-4.5 text-emerald-400" /> Actionable SEO Optimization Checklist
                </h4>

                <div className="space-y-3">
                  {seoData.seoChecklist.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                      <div className="mt-0.5 shrink-0 text-emerald-400 bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !loadingSeo && (
              <div className="glass-card border border-white/[0.02] rounded-2xl py-24 text-center">
                <Compass className="w-12 h-12 stroke-[1.2] mx-auto mb-3 text-zinc-600 animate-pulse" />
                <p className="font-bold text-zinc-300">Run SEO Metadata Audit</p>
                <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Extracts top-ranking tag keywords and compiles an actionable search checklist utilizing recent uploads metadata.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* -------------------------------------- */}
      {/* VIRAL TITLE LAB (TITLE GENERATOR) */}
      {/* -------------------------------------- */}
      {activeSubTab === "titles" && (
        <div className="space-y-6">
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl">
            <h3 className="font-display font-bold text-white text-base">Viral Title Optimization Lab</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-5">Input video themes or channel context to generate high CTR viral title alternatives.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateTitles();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  Your Video Topic / Channel Niche Definition
                </label>
                  <textarea
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    rows={3}
                    placeholder="e.g., Coding tutorials with fast-paced visual humor, deep-dives into tech histories, or unboxing future hardware..."
                    className="w-full bg-[#0c0c0e]/60 border border-white/5 focus:border-brand-red/40 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all resize-none font-medium"
                  />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingTitles || !nicheInput.trim()}
                  className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {loadingTitles ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Formulating Hooks...
                    </>
                  ) : (
                    <>
                      Generate Viral Titles <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {titlesError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">AI Title Generation Blocked</p>
                <p className="opacity-90 mt-1">{titlesError}</p>
              </div>
            </div>
          )}

          {titlesData.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-red" /> Suggested High-CTR Viral Title Alternates
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {titlesData.map((t, idx) => (
                  <div key={idx} className="glass-card glass-card-hover border border-white/[0.02] rounded-2xl p-5 flex flex-col justify-between shadow-md group transition-all">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2 py-0.5 bg-brand-red/10 border border-brand-red/25 text-brand-red text-[9px] font-bold uppercase tracking-widest rounded-full">
                          {t.style}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => copyToClipboard(t.title, idx)}
                          title="Copy to clipboard"
                          className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 bg-[#1c1c24] rounded border border-zinc-850 cursor-pointer shrink-0"
                        >
                          {copiedTitleIndex === idx ? (
                            <span className="text-[10px] text-emerald-400 font-bold px-1 flex items-center gap-1">
                              Copied!
                            </span>
                          ) : (
                            <Clipboard className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <h5 className="font-display font-bold text-white text-sm sm:text-base leading-snug group-hover:text-brand-red transition-colors pt-1">
                        {t.title}
                      </h5>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed mt-3.5 bg-zinc-950/40 rounded-xl p-3 border border-white/5 italic">
                      "{t.reasoning}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPETITOR ANALYSIS */}
      {activeSubTab === "competitors" && (
        <div className="space-y-6">
          <div className="glass-card border border-white/[0.04] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">Competitor Analysis &amp; Automatic Content Strategy</h3>
              <p className="text-xs text-gray-400 mt-0.5">Identifies typical growth competition, highlights unserved market gaps, and designs content strategies to win.</p>
            </div>
            {!competitorData && (
              <button
                type="button"
                onClick={handleGenerateCompetitors}
                disabled={loadingCompetitors}
                className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-center shrink-0"
              >
                {loadingCompetitors ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Tiers...
                  </>
                ) : (
                  <>
                    Generate Competitor Intel <Target className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {competitorsError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">AI Analysis Blocked</p>
                <p className="opacity-90 mt-1">{competitorsError}</p>
              </div>
            </div>
          )}

          {competitorData && (
            <div className="space-y-8 animate-fade-in">
              {/* Niche Summary Badge */}
              <div className="bg-brand-red/10 border border-brand-red/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider block">Identified Channel Classification</span>
                  <span className="text-sm font-bold text-white font-display mt-0.5 block sm:inline-block">{competitorData.nicheType}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCompetitors}
                  disabled={loadingCompetitors}
                  className="px-3.5 py-1.5 bg-white/[0.04] border border-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                  {loadingCompetitors ? "Re-Analyzing..." : "Refresh Report"}
                </button>
              </div>

              {/* Competitors Tiers Grid */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-red" />
                  Target Growth Competitors &amp; Benchmarks
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {competitorData.competitors.map((comp, idx) => (
                    <div key={idx} className="glass-card border border-white/[0.03] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-brand-purple"></div>
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h5 className="font-display font-bold text-white text-base truncate">{comp.name}</h5>
                          <span className="px-2 py-0.5 bg-white/[0.04] border border-white/5 text-zinc-400 text-[9px] font-bold uppercase rounded">
                            {comp.tier}
                          </span>
                        </div>

                        {/* Levers */}
                        <div className="space-y-1.5 mb-5">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Key Growth Drivers</span>
                          {comp.growthLevers.map((lever, lIdx) => (
                            <div key={lIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{lever}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strategy to beat */}
                      <div className="pt-4 border-t border-white/5 bg-[#09090d]/50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-brand-red uppercase tracking-widest block mb-1">Counter-Strategy Blueprint</span>
                        <p className="text-xs text-zinc-400 leading-relaxed italic">"{comp.strategyToBeat}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Gaps & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Content Strategy recommendations */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-brand-purple" />
                    Tailored Content Blueprint Recommendations
                  </h4>
                  <div className="space-y-4">
                    {competitorData.contentStrategyRecommendations.map((rec, idx) => (
                      <div key={idx} className="glass-card border border-white/[0.03] rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-red"></div>
                        <div>
                          <h5 className="font-display font-bold text-white text-base">{rec.strategyName}</h5>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{rec.rationale}</p>
                        </div>

                        {/* Action steps */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Action Implementation Plan</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rec.actionSteps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2 bg-white/[0.01] border border-white/[0.02] rounded-xl p-2.5 text-xs text-zinc-300">
                                <span className="w-5 h-5 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Market Gaps */}
                <div className="lg:col-span-4 space-y-4">
                  <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Unserved Market Gaps
                  </h4>
                  <div className="glass-card border border-white/[0.03] rounded-2xl p-6 shadow-md space-y-4 relative">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      These are niche voids and format variations that target competitors are currently under-utilizing:
                    </p>
                    <div className="space-y-3">
                      {competitorData.marketGaps.map((gap, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 bg-[#0a0a0f]/80 border border-white/[0.02] rounded-xl p-3 text-xs text-zinc-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
