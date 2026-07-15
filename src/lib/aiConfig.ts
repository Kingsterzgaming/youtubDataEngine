/**
 * Helper to get the correct headers for AI and YouTube endpoints
 * based on credentials stored in localStorage.
 */
export function getAiHeaders() {
  const provider = localStorage.getItem("yt_data_engine_ai_provider") || "auto";
  const geminiKey = localStorage.getItem("yt_data_engine_gemini_key") || "";
  const openaiKey = localStorage.getItem("yt_data_engine_openai_key") || "";
  const anthropicKey = localStorage.getItem("yt_data_engine_anthropic_key") || "";
  const ytKey = localStorage.getItem("yt_data_engine_key") || "";

  return {
    "Content-Type": "application/json",
    "x-youtube-api-key": ytKey,
    "x-ai-provider": provider,
    "x-gemini-api-key": geminiKey,
    "x-openai-api-key": openaiKey,
    "x-anthropic-api-key": anthropicKey
  };
}

export function getYouTubeHeaders() {
  const ytKey = localStorage.getItem("yt_data_engine_key") || "";
  return {
    "x-youtube-api-key": ytKey
  };
}
