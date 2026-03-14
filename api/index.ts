import type { CommentRow } from "../resume/types";

type CreateCommentInput = {
  page: string;
  content: string;
  quote?: string;
};

export async function fetchComments(page: string): Promise<CommentRow[]> {
  const response = await fetch(`/api/comments?page=${encodeURIComponent(page)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  return (await response.json()) as CommentRow[];
}

export async function createComment(input: CreateCommentInput) {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_COMMENTS_TOKEN
        ? { "X-Comment-Token": process.env.NEXT_PUBLIC_COMMENTS_TOKEN }
        : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to submit comment");
  }

  return response.json();
}
