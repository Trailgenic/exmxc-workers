const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600"
};

export function jsonResponse(payload) {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: JSON_HEADERS
  });
}

export async function fetchJsonOrError(url) {
  const response = await fetch(url);

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: "dataset fetch failed",
        status: response.status
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  return response.json();
}
