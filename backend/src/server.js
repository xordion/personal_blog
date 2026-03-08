"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "comments.db");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      quote TEXT,
      content TEXT NOT NULL,
      author_ip TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_comments_page_created_at ON comments(page, created_at DESC)");
});

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "20kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

function parseClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function normalizeInput(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/comments", (req, res) => {
  const page = normalizeInput(req.query.page || "resume", 64) || "resume";

  db.all(
    `SELECT id, page, quote, content, author_ip, created_at
     FROM comments
     WHERE page = ?
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT 200`,
    [page],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: "failed_to_read_comments" });
        return;
      }

      res.json({
        comments: rows.map((row) => ({
          id: row.id,
          page: row.page,
          quote: row.quote || "",
          content: row.content,
          author: row.author_ip,
          createdAt: new Date(row.created_at).toISOString(),
        })),
      });
    }
  );
});

app.post("/api/comments", (req, res) => {
  const page = normalizeInput(req.body.page || "resume", 64) || "resume";
  const quote = normalizeInput(req.body.quote || "", 260);
  const content = normalizeInput(req.body.content || "", 500);

  if (!content) {
    res.status(400).json({ error: "content_required" });
    return;
  }

  const authorIp = normalizeInput(parseClientIp(req), 64);
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO comments (page, quote, content, author_ip, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [page, quote, content, authorIp, createdAt],
    function onInsert(err) {
      if (err) {
        res.status(500).json({ error: "failed_to_create_comment" });
        return;
      }

      res.status(201).json({
        id: this.lastID,
        page,
        quote,
        content,
        author: authorIp,
        createdAt,
      });
    }
  );
});

app.use((err, _req, res, _next) => {
  if (err && err.message === "CORS blocked") {
    res.status(403).json({ error: "forbidden_origin" });
    return;
  }
  res.status(500).json({ error: "internal_error" });
});

app.listen(PORT, () => {
  console.log(`comment api listening on ${PORT}`);
});
