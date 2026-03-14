import type { NextApiRequest, NextApiResponse } from "next";
import { addComment, listComments } from "../../lib/commentsStore";

const MAX_CONTENT = 500;
const MAX_QUOTE = 260;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateBuckets = new Map<string, { count: number; ts: number }>();

function getClientKey(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return ip || req.socket.remoteAddress || "unknown";
}

function normalize(text: unknown): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.ts > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { count: 1, ts: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }
  bucket.count += 1;
  return true;
}

function checkToken(req: NextApiRequest) {
  const required = process.env.COMMENTS_TOKEN;
  if (!required) return true;
  const provided = req.headers["x-comment-token"];
  return provided === required;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Comment-Token");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (!enforceRateLimit(getClientKey(req))) {
    res.status(429).json({ error: "Rate limit exceeded." });
    return;
  }

  if (req.method === "GET") {
    const page = normalize(req.query.page);
    if (!page) {
      res.status(400).json({ error: "Missing page." });
      return;
    }
    const rows = await listComments(page);
    res.status(200).json(rows);
    return;
  }

  if (req.method === "POST") {
    if (!checkToken(req)) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const body = req.body || {};
    const page = normalize(body.page);
    const content = normalize(body.content);
    const quote = normalize(body.quote);

    if (!page || !content) {
      res.status(400).json({ error: "Missing fields." });
      return;
    }
    if (content.length > MAX_CONTENT || quote.length > MAX_QUOTE) {
      res.status(400).json({ error: "Content too long." });
      return;
    }

    const row = await addComment({
      page,
      content,
      quote,
      author: "Visitor",
    });

    res.status(201).json(row);
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
}
