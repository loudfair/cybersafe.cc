export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok", service: "cybersafe.cc" }), {
    headers: { "Content-Type": "application/json" },
  });
}
