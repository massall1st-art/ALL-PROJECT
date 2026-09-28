const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-this-token";
const DATA_FILE = path.join(__dirname, "videos.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

function readVideos() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function writeVideos(videos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("video/")) return cb(new Error("Only video files are allowed"));
    cb(null, true);
  }
});

function adminOnly(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// Public catalog
app.get("/api/videos", (req, res) => {
  res.json(readVideos().sort((a,b) => b.createdAt - a.createdAt));
});

// Admin upload
app.post("/api/videos", adminOnly, upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Video file is required" });

  const videos = readVideos();
  const item = {
    id: crypto.randomUUID(),
    title: req.body.title || path.parse(req.file.originalname).name,
    category: req.body.category || "Film",
    description: req.body.description || "",
    filename: req.file.filename,
    originalName: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
    views: 0,
    createdAt: Date.now()
  };

  videos.push(item);
  writeVideos(videos);
  res.status(201).json(item);
});

// Admin delete
app.delete("/api/videos/:id", adminOnly, (req, res) => {
  const videos = readVideos();
  const item = videos.find(v => v.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Video not found" });

  const file = path.join(UPLOAD_DIR, item.filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);

  writeVideos(videos.filter(v => v.id !== req.params.id));
  res.json({ ok: true });
});

// View counter
app.post("/api/videos/:id/view", (req, res) => {
  const videos = readVideos();
  const item = videos.find(v => v.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Video not found" });
  item.views = (item.views || 0) + 1;
  writeVideos(videos);
  res.json({ views: item.views });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, () => console.log(`NEONFLIX running on port ${PORT}`));
