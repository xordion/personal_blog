const API_BASE = "";

export async function fetchComments(page = "resume") {
  const response = await fetch(
    `${API_BASE}/api/comments?page=${encodeURIComponent(page)}`,
    {
      headers: { Accept: "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error("failed_to_fetch_comments");
  }
  const data = await response.json();
  return data.comments || [];
}

export async function createComment(payload) {
  const response = await fetch(`${API_BASE}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("failed_to_create_comment");
  }
  return response.json();
}
