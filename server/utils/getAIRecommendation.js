export async function getAIRecommendation(req, res, userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const geminiPrompt = `
        Here is a list of avaiable products:
        ${JSON.stringify(products, null, 2)}

        Based on the following user request, filter and suggest the best matching products:
        "${userPrompt}"

        Only return the matching products in JSON format.
    `;

    // Simple in-memory cache to avoid repeated AI calls for identical prompts
    const CACHE_TTL_MINUTES = Number(process.env.AI_CACHE_TTL_MINUTES) || 5;
    if (!global.__ai_cache) global.__ai_cache = new Map();
    const cache = global.__ai_cache;
    const makeCacheKey = (prompt, prods) => {
      const ids = Array.isArray(prods) ? prods.map((p) => p.id).join(",") : "";
      return JSON.stringify({ prompt, ids });
    };

    const cacheKey = makeCacheKey(userPrompt, products);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MINUTES * 60 * 1000) {
      return { success: true, products: cached.data, cached: true };
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const maxAttempts = Number(process.env.AI_MAX_ATTEMPTS) || 3;

    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
      attempt++;
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
        }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        data = { parseError: true, rawText };
      }

      if (response.ok) {
        const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        const cleanedText = aiResponseText.replace(/```json|```/g, ``).trim();

        if (!cleanedText) {
          lastError = { message: "AI response empty", data, rawText };
          break;
        }

        let parsedProducts;
        try {
          parsedProducts = JSON.parse(cleanedText);
        } catch (error) {
          lastError = { message: "Failed to parse AI response", error, rawText };
          break;
        }

        cache.set(cacheKey, { ts: Date.now(), data: parsedProducts });
        return { success: true, products: parsedProducts };
      }

      lastError = { status: response.status, statusText: response.statusText, data };
      if (response.status === 429 || response.status >= 500) {
        const ra = response.headers.get("retry-after");
        const retryAfterMs = ra && !Number.isNaN(Number(ra)) ? Number(ra) * 1000 : Math.min(1000 * 2 ** (attempt - 1), 10000);
        const jitter = Math.floor(Math.random() * 300);
        const wait = retryAfterMs + jitter;
        console.warn(`AI request failed (status=${response.status}). Attempt ${attempt}/${maxAttempts}. Retrying in ${wait}ms.`);
        await sleep(wait);
        continue;
      } else {
        break;
      }
    }

    return { success: false, message: `AI API error after ${attempt} attempts`, error: lastError };
    const cleanedText = aiResponseText.replace(/```json|```/g, ``).trim();

    if (!cleanedText) {
      // Log full payload for debugging
      // Debugging logs removed in production
      return { success: false, message: "AI response is empty or invalid.", error: data, rawText };
    }

    let parsedProducts;
    try {
      parsedProducts = JSON.parse(cleanedText);
    } catch (error) {
      return { success: false, message: "Failed to parse AI response" };
    }
    return { success: true, products: parsedProducts };
  } catch (error) {
    return { success: false, message: "Internal server error." };
  }
} 