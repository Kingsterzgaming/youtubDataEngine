import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get YouTube API key (from header or env)
function getYouTubeApiKey(req: express.Request): string {
  const headerKey = req.headers["x-youtube-api-key"];
  if (headerKey && typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }
  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  throw new Error("YOUTUBE_API_KEY_MISSING");
}

// Fetch helper for YouTube Data API v3
async function ytFetch(endpoint: string, params: Record<string, string>, apiKey: string) {
  const queryParams = new URLSearchParams({ ...params, key: apiKey });
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `YouTube API error: ${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// Channel resolver
async function resolveChannelId(input: string, apiKey: string) {
  let cleaned = input.trim();
  
  // 1. Is it a 24-character channel ID starting with UC?
  if (/^UC[A-Za-z0-9_-]{22}$/.test(cleaned)) {
    const data = await ytFetch("channels", { part: "snippet,statistics,brandingSettings", id: cleaned }, apiKey);
    if (data.items && data.items.length > 0) {
      return {
        id: data.items[0].id,
        title: data.items[0].snippet.title,
        thumbnail: data.items[0].snippet.thumbnails?.default?.url || "",
        customUrl: data.items[0].snippet.customUrl
      };
    }
  }

  // 2. Parse URL patterns
  let handle = "";
  if (cleaned.includes("youtube.com/")) {
    const channelMatch = cleaned.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
    if (channelMatch) {
      const cid = channelMatch[1];
      const data = await ytFetch("channels", { part: "snippet,statistics,brandingSettings", id: cid }, apiKey);
      if (data.items && data.items.length > 0) {
        return {
          id: data.items[0].id,
          title: data.items[0].snippet.title,
          thumbnail: data.items[0].snippet.thumbnails?.default?.url || "",
          customUrl: data.items[0].snippet.customUrl
        };
      }
    }

    const handleMatch = cleaned.match(/\/@([A-Za-z0-9._-]+)/);
    if (handleMatch) {
      handle = "@" + handleMatch[1];
    } else {
      const cMatch = cleaned.match(/\/c\/([A-Za-z0-9._-]+)/);
      if (cMatch) handle = cMatch[1];
      else {
        const userMatch = cleaned.match(/\/user\/([A-Za-z0-9._-]+)/);
        if (userMatch) handle = userMatch[1];
      }
    }
  } else if (cleaned.startsWith("@")) {
    handle = cleaned;
  } else {
    handle = cleaned;
  }

  // 3. Resolve by handle using channels/forHandle
  if (handle) {
    try {
      const data = await ytFetch("channels", { part: "snippet,statistics,brandingSettings", forHandle: handle }, apiKey);
      if (data.items && data.items.length > 0) {
        return {
          id: data.items[0].id,
          title: data.items[0].snippet.title,
          thumbnail: data.items[0].snippet.thumbnails?.default?.url || "",
          customUrl: data.items[0].snippet.customUrl
        };
      }
    } catch (e) {
      // ignore and fallback
    }

    // 4. Resolve by search
    const searchData = await ytFetch("search", {
      part: "snippet",
      type: "channel",
      q: handle,
      maxResults: "1"
    }, apiKey);
    
    if (searchData.items && searchData.items.length > 0) {
      const item = searchData.items[0];
      const cid = item.id.channelId || item.snippet.channelId;
      if (cid) {
        // Fetch full profile
        const details = await ytFetch("channels", { part: "snippet", id: cid }, apiKey);
        if (details.items && details.items.length > 0) {
          return {
            id: details.items[0].id,
            title: details.items[0].snippet.title,
            thumbnail: details.items[0].snippet.thumbnails?.default?.url || "",
            customUrl: details.items[0].snippet.customUrl
          };
        }
      }
    }
  }

  throw new Error(`Could not resolve channel identifier for "${input}"`);
}

// ----------------------------------------
// YouTube Data API Proxies
// ----------------------------------------

// Resolve input to Channel
app.post("/api/youtube/resolve", async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      res.status(400).json({ error: "Missing 'input' parameter" });
      return;
    }
    const apiKey = getYouTubeApiKey(req);
    const result = await resolveChannelId(input, apiKey);
    res.json(result);
  } catch (err: any) {
    console.error("Resolve error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Fetch Channel Profile Details
app.get("/api/youtube/channel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = getYouTubeApiKey(req);
    const data = await ytFetch("channels", {
      part: "snippet,statistics,brandingSettings,contentDetails",
      id
    }, apiKey);

    if (!data.items || data.items.length === 0) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    res.json(data.items[0]);
  } catch (err: any) {
    console.error("Channel error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Fetch Channel Videos
app.get("/api/youtube/channel/:id/videos", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const apiKey = getYouTubeApiKey(req);

    // 1. Get channel uploads playlist
    const channelData = await ytFetch("channels", { part: "contentDetails", id }, apiKey);
    if (!channelData.items || channelData.items.length === 0) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    const uploadsId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) {
      res.status(404).json({ error: "No uploads playlist found for this channel" });
      return;
    }

    // 2. Get playlist items
    const playlistItems = await ytFetch("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploadsId,
      maxResults: String(limit)
    }, apiKey);

    if (!playlistItems.items || playlistItems.items.length === 0) {
      res.json([]);
      return;
    }

    // 3. Fetch full video statistics
    const videoIds = playlistItems.items.map((item: any) => item.contentDetails.videoId).join(",");
    const videosData = await ytFetch("videos", {
      part: "snippet,statistics,contentDetails",
      id: videoIds
    }, apiKey);

    const formatted = (videosData.items || []).map((v: any) => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description || "",
      publishedAt: v.snippet.publishedAt,
      thumbnails: v.snippet.thumbnails,
      tags: v.snippet.tags || [],
      duration: v.contentDetails.duration, // e.g. PT12M34S
      viewCount: parseInt(v.statistics.viewCount || "0", 10),
      likeCount: parseInt(v.statistics.likeCount || "0", 10),
      commentCount: parseInt(v.statistics.commentCount || "0", 10)
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error("Videos error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Fetch Video Comments
app.get("/api/youtube/video/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const apiKey = getYouTubeApiKey(req);

    const data = await ytFetch("commentThreads", {
      part: "snippet",
      videoId: id,
      maxResults: String(limit)
    }, apiKey);

    const formatted = (data.items || []).map((item: any) => {
      const topLevel = item.snippet.topLevelComment.snippet;
      return {
        id: item.id,
        author: topLevel.authorDisplayName,
        authorAvatar: topLevel.authorProfileImageUrl,
        text: topLevel.textDisplay,
        textOriginal: topLevel.textOriginal,
        likeCount: parseInt(topLevel.likeCount || "0", 10),
        publishedAt: topLevel.publishedAt
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error("Comments error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Fetch Channel Playlists
app.get("/api/youtube/channel/:id/playlists", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = getYouTubeApiKey(req);

    const data = await ytFetch("playlists", {
      part: "snippet,contentDetails",
      channelId: id,
      maxResults: "25"
    }, apiKey);

    const formatted = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || "",
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      videoCount: parseInt(item.contentDetails?.itemCount || "0", 10)
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error("Playlists error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// General YouTube Search
app.get("/api/youtube/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) {
      res.status(400).json({ error: "Missing search query 'q'" });
      return;
    }
    const apiKey = getYouTubeApiKey(req);
    const data = await ytFetch("search", {
      part: "snippet",
      q: q as string,
      type: (type as string) || "video,channel,playlist",
      maxResults: "20"
    }, apiKey);

    const formatted = (data.items || []).map((item: any) => ({
      id: item.id.videoId || item.id.channelId || item.id.playlistId || item.id,
      type: item.id.videoId ? "video" : item.id.channelId ? "channel" : item.id.playlistId ? "playlist" : "unknown",
      title: item.snippet.title,
      description: item.snippet.description || "",
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error("Search error:", err.message);
    if (err.message === "YOUTUBE_API_KEY_MISSING") {
      res.status(401).json({ error: "YOUTUBE_API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ----------------------------------------
// Gemini AI Intelligence Endpoints
// ----------------------------------------

const getAiConfig = (req: express.Request) => {
  const provider = (req.headers["x-ai-provider"] as string || "auto").trim().toLowerCase();
  
  const customGeminiKey = (req.headers["x-gemini-api-key"] as string || "").trim();
  const customOpenaiKey = (req.headers["x-openai-api-key"] as string || "").trim();
  const customAnthropicKey = (req.headers["x-anthropic-api-key"] as string || "").trim();

  const envGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const envOpenaiKey = (process.env.OPENAI_API_KEY || "").trim();
  const envAnthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();

  const geminiKey = customGeminiKey || (envGeminiKey !== "MY_GEMINI_API_KEY" ? envGeminiKey : "");
  const openaiKey = customOpenaiKey || envOpenaiKey;
  const anthropicKey = customAnthropicKey || envAnthropicKey;

  return {
    provider,
    geminiKey,
    openaiKey,
    anthropicKey
  };
};

function normalizeSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  const normalized: any = Array.isArray(schema) ? [] : {};
  for (const key of Object.keys(schema)) {
    let val = schema[key];
    if (key === "type" && typeof val === "string") {
      val = val.toLowerCase();
    } else if (typeof val === "object") {
      val = normalizeSchema(val);
    }
    normalized[key] = val;
  }
  return normalized;
}

async function generateAiResponse(
  req: express.Request,
  prompt: string,
  schema: any,
  systemInstruction?: string
): Promise<any> {
  const config = getAiConfig(req);
  
  let activeProvider = config.provider;
  if (activeProvider === "auto" || !activeProvider) {
    if (config.geminiKey) {
      activeProvider = "gemini";
    } else if (config.openaiKey) {
      activeProvider = "openai";
    } else if (config.anthropicKey) {
      activeProvider = "anthropic";
    } else {
      throw new Error("NO_AI_KEYS_CONFIGURED");
    }
  }

  // Ensure key exists for active provider, or fallback
  if (activeProvider === "gemini" && !config.geminiKey) {
    if (config.openaiKey) activeProvider = "openai";
    else if (config.anthropicKey) activeProvider = "anthropic";
    else throw new Error("NO_AI_KEYS_CONFIGURED");
  } else if (activeProvider === "openai" && !config.openaiKey) {
    if (config.geminiKey) activeProvider = "gemini";
    else if (config.anthropicKey) activeProvider = "anthropic";
    else throw new Error("NO_AI_KEYS_CONFIGURED");
  } else if (activeProvider === "anthropic" && !config.anthropicKey) {
    if (config.geminiKey) activeProvider = "gemini";
    else if (config.openaiKey) activeProvider = "openai";
    else throw new Error("NO_AI_KEYS_CONFIGURED");
  }

  if (activeProvider === "gemini") {
    const ai = new GoogleGenAI({
      apiKey: config.geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }
    return JSON.parse(response.text.trim());

  } else if (activeProvider === "openai") {
    const stdSchema = normalizeSchema(schema);
    const systemPrompt = `${systemInstruction || "You are a helpful YouTube viral growth consultant."} You MUST return a JSON response matching this EXACT JSON schema: ${JSON.stringify(stdSchema)}`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;
    if (!textContent) {
      throw new Error("Empty response from OpenAI");
    }
    return JSON.parse(textContent.trim());

  } else if (activeProvider === "anthropic") {
    const stdSchema = normalizeSchema(schema);
    const systemPrompt = `${systemInstruction || "You are a helpful YouTube viral growth consultant."} You MUST return only a single JSON object matching this schema. Do not enclose it in any markdown backticks or write anything else than the JSON block. Schema: ${JSON.stringify(stdSchema)}`;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    let textContent = data.content?.[0]?.text;
    if (!textContent) {
      throw new Error("Empty response from Anthropic");
    }
    
    textContent = textContent.trim();
    if (textContent.startsWith("```json")) {
      textContent = textContent.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (textContent.startsWith("```")) {
      textContent = textContent.replace(/^```/, "").replace(/```$/, "").trim();
    }
    
    return JSON.parse(textContent);
  }

  throw new Error("Unsupported AI Provider selection.");
}

// AI Test Connection Endpoint
app.post("/api/ai/test-connection", async (req, res) => {
  try {
    const config = getAiConfig(req);
    let activeProvider = config.provider;
    if (activeProvider === "auto" || !activeProvider) {
      if (config.geminiKey) activeProvider = "gemini";
      else if (config.openaiKey) activeProvider = "openai";
      else if (config.anthropicKey) activeProvider = "anthropic";
      else {
        res.status(400).json({ error: "No AI keys configured for 'auto' mode." });
        return;
      }
    }

    const testPrompt = "Return a JSON object with a single boolean field 'working' set to true.";
    const schema = {
      type: Type.OBJECT,
      properties: {
        working: { type: Type.BOOLEAN }
      },
      required: ["working"]
    };

    const result = await generateAiResponse(req, testPrompt, schema, "Respond with JSON.");
    res.json({ success: true, provider: activeProvider, result });
  } catch (err: any) {
    console.error("AI Test error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// AI Endpoint: Analyze Channel Niche & Strategy
app.post("/api/ai/analyze-channel", async (req, res) => {
  try {
    const { channel, videos } = req.body;
    if (!channel) {
      res.status(400).json({ error: "Missing channel data" });
      return;
    }

    const videoSummary = (videos || [])
      .slice(0, 8)
      .map((v: any, index: number) => `${index + 1}. Title: "${v.title}" | Views: ${v.viewCount} | Likes: ${v.likeCount}\n   Description snippet: ${v.description.slice(0, 150)}...`)
      .join("\n\n");

    const prompt = `Analyze this YouTube Channel and its recent performance to generate an advanced AI Channel Audit, Content Strategy, and Niche Detector report.

CHANNEL PROFILE:
Title: ${channel.snippet?.title}
Description: ${channel.snippet?.description}
Subscribers: ${channel.statistics?.subscriberCount}
Total Views: ${channel.statistics?.viewCount}
Total Videos: ${channel.statistics?.videoCount}

RECENT VIDEOS PERFORMANCE:
${videoSummary || "No recent videos found."}

Provide your analysis in a highly professional, constructive tone. Use formatting to make it extremely readable.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        channelAudit: {
          type: Type.STRING,
          description: "In-depth review of channel setup, branding consistency, description clarity, and key strengths based on metrics."
        },
        nicheAnalysis: {
          type: Type.STRING,
          description: "Identification of the channel's target audience, main sub-niches, and saturation/opportunity levels in the market."
        },
        contentStrategy: {
          type: Type.STRING,
          description: "Detailed roadmap of content formats, recommended storytelling structure, and thumbnail/hook suggestions."
        },
        tacticalRecommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 5-6 concrete, actionable tasks the creator should execute immediately to boost CTR and retention."
        }
      },
      required: ["channelAudit", "nicheAnalysis", "contentStrategy", "tacticalRecommendations"]
    };

    const result = await generateAiResponse(req, prompt, schema, "You are an advanced YouTube content audit assistant.");
    res.json(result);
  } catch (err: any) {
    console.error("AI Analyze error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// AI Endpoint: Title Generator
app.post("/api/ai/title-generator", async (req, res) => {
  try {
    const { currentTitles, nicheDescription } = req.body;
    const titlesList = (currentTitles || []).map((t: string) => `- ${t}`).join("\n");

    const prompt = `You are a YouTube viral growth consultant. Your job is to generate 5 high-converting, attention-grabbing titles based on the channel's niche and existing titles, explaining the psychological and structural hook of each.

CHANNEL NICHE/CONTEXT:
${nicheDescription || "General educational or entertainment content"}

EXISTING SUCCESSFUL TITLES FOR INSPIRATION:
${titlesList || "No existing titles provided."}

Generate exactly 5 viral title suggestions.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The recommended viral title." },
          reasoning: { type: Type.STRING, description: "The psychological trigger or click-through reason (e.g. curiosity gap, high stakes, clear payoff)." },
          style: { type: Type.STRING, description: "Style classification (e.g., 'Curiosity Gap', 'Challenge', 'Listicle', 'How-to', 'Fear of Missing Out')" }
        },
        required: ["title", "reasoning", "style"]
      }
    };

    const result = await generateAiResponse(req, prompt, schema, "You are a YouTube viral growth consultant.");
    res.json(result);
  } catch (err: any) {
    console.error("AI Title Generator error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// AI Endpoint: Growth Predictor
app.post("/api/ai/growth-predictor", async (req, res) => {
  try {
    const { statistics, channelTitle } = req.body;
    if (!statistics) {
      res.status(400).json({ error: "Missing statistics" });
      return;
    }

    const subs = parseInt(statistics.subscriberCount || "0", 10);
    const views = parseInt(statistics.viewCount || "0", 10);
    const videos = parseInt(statistics.videoCount || "0", 10);

    const prompt = `You are a predictive YouTube algorithm modeller and data scientist. Based on the channel's current stats, perform a 12-month growth simulation forecasting Conservative, Moderate, and Aggressive tracks, as well as crucial milestone timelines and core strategies.

CHANNEL STATS FOR "${channelTitle || "this channel"}":
- Current Subscribers: ${subs}
- Current Lifetime Views: ${views}
- Current Video Count: ${videos}
- Average Views per Video: ${videos > 0 ? Math.round(views / videos) : 0}

Create a monthly simulation for the next 12 months, assuming baseline natural growth compounded with varying retention and click-through optimisations.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        projections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING, description: "e.g., 'Month 1', 'Month 2'..." },
              conservative: { type: Type.INTEGER, description: "Subscriber count in the conservative (slow/organic) track" },
              moderate: { type: Type.INTEGER, description: "Subscriber count in the moderate (optimized consistency) track" },
              aggressive: { type: Type.INTEGER, description: "Subscriber count in the aggressive (viral breakthrough) track" }
            },
            required: ["month", "conservative", "moderate", "aggressive"]
          },
          description: "12-month projections of subscriber count across three growth tracks."
        },
        milestones: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "e.g., '10k Subscribers', '1M Total Views'..." },
              timeframe: { type: Type.STRING, description: "e.g., 'Month 3 (Moderate Track)', 'Month 8 (Conservative)'..." },
              requirements: { type: Type.STRING, description: "Crucial strategic requirements to achieve this milestone." }
            },
            required: ["name", "timeframe", "requirements"]
          },
          description: "Key growth milestones and when they will be hit on which tracks."
        },
        growthStrategy: {
          type: Type.STRING,
          description: "A summary of algorithmic factors, audience loops, and technical strategies to shift from Conservative to Aggressive growth."
        }
      },
      required: ["projections", "milestones", "growthStrategy"]
    };

    const result = await generateAiResponse(req, prompt, schema, "You are a predictive YouTube growth simulation modeller.");
    res.json(result);
  } catch (err: any) {
    console.error("AI Growth Predictor error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// AI Endpoint: Keyword Extractor
app.post("/api/ai/keyword-extractor", async (req, res) => {
  try {
    const { videoMetadata } = req.body;
    const videoText = (videoMetadata || [])
      .map((v: any) => `Title: ${v.title}\nTags: ${(v.tags || []).join(", ")}\nDesc: ${v.description.slice(0, 100)}...`)
      .join("\n\n");

    const prompt = `You are a YouTube Search Engine Optimization (SEO) expert. Based on the following video titles, description snippets, and existing tags, extract the top 10 most relevant search keywords, categorize their search volume intent, and provide a comprehensive optimization checklist.

VIDEOS DATA:
${videoText || "No video metadata provided."}

Extract key optimization suggestions.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        keywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              intent: { type: Type.STRING, description: "Search intent: e.g. Informational, Navigational, Commercial, Tutorial" },
              relevanceScore: { type: Type.NUMBER, description: "Relevance scale 0.0 to 1.0 based on current metadata alignment" }
            },
            required: ["keyword", "intent", "relevanceScore"]
          }
        },
        seoChecklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Actionable points for title keywords, descriptions density, cards, playlists structuring, and file naming."
        }
      },
      required: ["keywords", "seoChecklist"]
    };

    const result = await generateAiResponse(req, prompt, schema, "You are an expert YouTube SEO optimizer.");
    res.json(result);
  } catch (err: any) {
    console.error("AI SEO error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// AI Endpoint: Competitor recommendations & Growth Competition
app.post("/api/ai/competitor-recommendations", async (req, res) => {
  try {
    const { channel, videos } = req.body;
    if (!channel) {
      res.status(400).json({ error: "Missing channel data" });
      return;
    }

    const videoSummary = (videos || [])
      .slice(0, 8)
      .map((v: any, index: number) => `${index + 1}. Title: "${v.title}"\n   Description: ${v.description.slice(0, 100)}...`)
      .join("\n\n");

    const prompt = `Analyze this YouTube channel to identify potential growth competition and recommend tailored content strategies to outperform similar channels.

CHANNEL PROFILE:
Title: ${channel.snippet?.title}
Description: ${channel.snippet?.description || "No description provided."}
Subscribers: ${channel.statistics?.subscriberCount || "0"}
Total Videos: ${channel.statistics?.videoCount || "0"}

RECENT VIDEOS CONTEXT:
${videoSummary || "No recent videos found."}

Your analysis should classify the channel's specific sub-genre/niche, identify 3 distinct tiers of competitors they face (Micro, Mid-tier, and Mega Benchmark), find unserved market gaps, and recommend automatic content strategies to boost click-through rates and view duration against these competitors.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        nicheType: {
          type: Type.STRING,
          description: "The specific sub-genre and category classification of the channel."
        },
        competitors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name/Handle of a typical representative competitor in this niche." },
              tier: { type: Type.STRING, description: "Size tier (e.g. 'Micro-competitor', 'Mid-tier challenger', 'Mega Benchmark')" },
              growthLevers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 primary factors fueling their current growth." },
              strategyToBeat: { type: Type.STRING, description: "Specific tactic to differentiate or out-value them." }
            },
            required: ["name", "tier", "growthLevers", "strategyToBeat"]
          },
          description: "List of typical competitor profiles in this space."
        },
        contentStrategyRecommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strategyName: { type: Type.STRING, description: "Title of the proposed content strategy." },
              rationale: { type: Type.STRING, description: "Why this strategy is highly likely to succeed against competitors." },
              actionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific production and formatting actions to execute." }
            },
            required: ["strategyName", "rationale", "actionSteps"]
          },
          description: "Concrete, automated content strategies designed to seize current market gaps."
        },
        marketGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Unsaturated areas or format styles that competitor channels are currently ignoring or under-serving."
        }
      },
      required: ["nicheType", "competitors", "contentStrategyRecommendations", "marketGaps"]
    };

    const result = await generateAiResponse(req, prompt, schema, "You are a senior YouTube competitor and content strategist.");
    res.json(result);
  } catch (err: any) {
    console.error("AI Competitors recommendations error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// AI Endpoint: Analyze Comments Sentiment & Feedback Themes
app.post("/api/ai/analyze-comments", async (req, res) => {
  try {
    const { comments, videoTitle } = req.body;
    if (!comments || comments.length === 0) {
      res.status(400).json({ error: "No comments provided for analysis" });
      return;
    }

    const commentBatch = comments
      .slice(0, 40)
      .map((c: any, i: number) => `${i + 1}. "${c.textOriginal || c.text}"`)
      .join("\n");

    const prompt = `Analyze the following actual audience comments from a video titled "${videoTitle || "Recent Video"}" to extract detailed sentiment ratios, recurring key themes/feedback, typical questions asked by users, and a responsive strategy for the creator.

RECENT TOP COMMENTS:
${commentBatch}

Perform your evaluation thoroughly and return a valid JSON object.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        sentimentRatio: {
          type: Type.OBJECT,
          properties: {
            positive: { type: Type.INTEGER, description: "Percentage of positive sentiment (0 to 100)" },
            neutral: { type: Type.INTEGER, description: "Percentage of neutral/inquisitive sentiment (0 to 100)" },
            negative: { type: Type.INTEGER, description: "Percentage of negative/constructive criticism sentiment (0 to 100)" }
          },
          required: ["positive", "neutral", "negative"]
        },
        keyThemes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Top 3-4 recurring themes, complaints, or praise items seen in the comments."
        },
        userQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Typical, interesting, or frequent questions asked by the audience in these comments."
        },
        creatorResponseStrategy: {
          type: Type.STRING,
          description: "A professional response advice or engagement strategy for the creator to build community trust."
        }
      },
      required: ["sentimentRatio", "keyThemes", "userQuestions", "creatorResponseStrategy"]
    };

    const result = await generateAiResponse(req, prompt, schema, "You are an expert YouTube community manager and sentiment analyst.");
    res.json(result);
  } catch (err: any) {
    console.error("AI Comments analysis error:", err.message);
    if (err.message === "NO_AI_KEYS_CONFIGURED") {
      res.status(401).json({ error: "NO_AI_KEYS_CONFIGURED" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ----------------------------------------
// Serve Frontend / Build System
// ----------------------------------------

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`YouTube Data Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
