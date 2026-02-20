/**
 * Cloudflare Pages Function — /api/ai
 * Proxies natural-language prompts to Claude (Anthropic) server-side.
 * ANTHROPIC_API_KEY is stored as a Cloudflare Pages secret — never exposed to client.
 */

const SYSTEM_PROMPT = `You are an API call assistant embedded in cybersafe.cc, a security research tool for fitness platform API analysis.

When the user describes what they want in plain English, respond with ONLY a valid JSON object (no markdown fences, no extra text) in this exact shape:

{
  "explanation": "One sentence explaining what this call does and what to expect.",
  "call": {
    "url": "https://...",
    "method": "GET",
    "headers": { "Header-Name": "value" },
    "params": { "param": "value" },
    "body": null
  },
  "note": "Optional warning or tip about auth requirements, rate limits, etc."
}

Rules:
- method must be GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS
- headers and params must be flat string→string objects (never nested)
- body is a JSON string (for POST/PUT) or null
- For the Momence IDOR endpoint use: https://readonly-api.momence.com/host-plugins/host/{id}/host-schedule — replace {id} with any number 1–65000
- For Mindbody API: base is https://api.mindbodyonline.com/public/v6/ — requires X-MINDBODY-SITE-ID + Api-Key headers
- For IP lookups use https://ipapi.co/{ip}/json/
- For DNS use https://dns.google/resolve?name={domain}&type=A
- For threat intel use https://urlhaus-api.abuse.ch/v1/url/ (POST, form body: url=...)
- Always use https
- If the user's request is ambiguous, pick the most likely interpretation and note it`;

export async function onRequestPost(context) {
  const key = context.env.ANTHROPIC_API_KEY;
  if (!key) return jsonResponse({ error: 'AI service not configured' }, 503);

  let payload;
  try { payload = await context.request.json(); } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { message } = payload;
  if (!message || typeof message !== 'string' || message.trim().length < 2) {
    return jsonResponse({ error: 'message is required' }, 400);
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message.trim() }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return jsonResponse({ error: data.error?.message || 'Upstream error', status: resp.status }, 502);
    }

    const raw = data.content?.[0]?.text || '';

    // Parse the JSON the model returned
    let parsed;
    try {
      // Strip any accidental markdown fences
      const clean = raw.replace(/^```(?:json)?\n?/,'').replace(/\n?```$/,'').trim();
      parsed = JSON.parse(clean);
    } catch {
      // Return raw text so client can still show it
      return jsonResponse({ explanation: raw, call: null, note: null });
    }

    return jsonResponse(parsed);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
