/**
 * Cloudflare Pages Function — /api/proxy
 * Forwards API requests server-side to avoid CORS issues.
 */

export async function onRequestPost(context) {
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const { url, method = "GET", headers: reqHeaders = {}, body: reqBody } = payload;

  if (!url) return jsonResponse({ error: "url is required" }, 400);

  if (!/^https?:\/\//i.test(url)) {
    return jsonResponse({ error: "Only http/https URLs are supported" }, 400);
  }

  const fetchHeaders = {
    "User-Agent": "cybersafe.cc/1.0",
    ...reqHeaders,
  };

  let fetchBody = undefined;
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && reqBody) {
    fetchBody = reqBody;
  }

  try {
    const upstream = await fetch(url, {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      body: fetchBody,
      redirect: "follow",
    });

    const respBody = await upstream.text();
    const respHeaders = {};
    upstream.headers.forEach((v, k) => { respHeaders[k] = v; });

    return jsonResponse({
      status: upstream.status,
      statusText: upstream.statusText,
      body: respBody,
      headers: respHeaders,
    });
  } catch (err) {
    return jsonResponse({
      status: 0,
      statusText: "Connection Error",
      body: err.message,
      headers: {},
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
