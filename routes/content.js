const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const News = require("../models/News");
const Blog = require("../models/Blog");
const Job = require("../models/Job");
const SiteContent = require("../models/SiteContent");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const uploadDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, "-")}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadMultiple = upload.array("images", 10);

function getModel(type) {
  if (type === "events") return Event;
  if (type === "news") return News;
  if (type === "blogs") return Blog;
  return null;
}

function eventFields(body, files) {
  return {
    name: body.name,
    description: body.description,
    date: body.date,
    images: (files || []).map((f) => `/uploads/${f.filename}`),
  };
}

function contentFields(body, files) {
  return {
    title: body.title,
    category: body.category,
    content: body.content,
    date: body.date,
    images: (files || []).map((f) => `/uploads/${f.filename}`),
  };
}

// GET list
router.get("/api/:type(events|news|blogs)", async (req, res) => {
  try {
    if (!isDbConnected()) {
      console.warn("Content API: MongoDB not connected, returning empty list");
      return res.json([]);
    }
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ error: "Invalid type" });
    const list = await Model.find().sort({ date: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error("Content API GET error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post("/api/:type(events|news|blogs)", (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ error: "Invalid type" });

    const body = req.body;
    const files = req.files || [];

    let doc;
    if (type === "events") {
      if (!body.name || !body.description || !body.date)
        return res.status(400).json({ error: "name, description, date required" });
      doc = await Model.create(eventFields(body, files));
    } else {
      if (!body.title || !body.category || !body.content || !body.date)
        return res.status(400).json({ error: "title, category, content, date required" });
      doc = await Model.create(contentFields(body, files));
    }
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put("/api/:type(events|news|blogs)/:id", (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ error: "Invalid type" });

    const body = req.body;
    const files = req.files || [];
    const existing = await Model.findById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    let payload;
    if (type === "events") {
      payload = {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        date: body.date ?? existing.date,
        images: files.length ? files.map((f) => `/uploads/${f.filename}`) : existing.images,
      };
    } else {
      payload = {
        title: body.title ?? existing.title,
        category: body.category ?? existing.category,
        content: body.content ?? existing.content,
        date: body.date ?? existing.date,
        images: files.length ? files.map((f) => `/uploads/${f.filename}`) : existing.images,
      };
    }
    const updated = await Model.findByIdAndUpdate(id, payload, { new: true }).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/api/:type(events|news|blogs)/:id", async (req, res) => {
  try {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ error: "Invalid type" });
    const deleted = await Model.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Jobs API (no file upload) ---
router.get("/api/jobs", async (req, res) => {
  try {
    if (!isDbConnected()) return res.json([]);
    const list = await Job.find().sort({ date: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error("Jobs API GET error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/jobs", async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: "Database not connected" });
    const { title, employmentType, salaryRange, location, description } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const doc = await Job.create({
      title,
      employmentType: employmentType || "Full Time",
      salaryRange: salaryRange || "",
      location: location || "",
      description: description || "",
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/jobs/:id", async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: "Database not connected" });
    const { id } = req.params;
    const { title, employmentType, salaryRange, location, description, date } = req.body;
    const existing = await Job.findById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = await Job.findByIdAndUpdate(
      id,
      {
        title: title ?? existing.title,
        employmentType: employmentType ?? existing.employmentType,
        salaryRange: salaryRange ?? existing.salaryRange,
        location: location ?? existing.location,
        description: description ?? existing.description,
        date: date ? new Date(date) : existing.date,
      },
      { new: true }
    ).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/jobs/:id", async (req, res) => {
  try {
    const deleted = await Job.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Site CMS (site content) ---
router.get("/api/site-content", async (req, res) => {
  try {
    if (!isDbConnected()) return res.json({});
    const list = await SiteContent.find().lean();
    const obj = {};
    list.forEach((doc) => {
      if (doc.type === "image" && doc.value) obj[doc.key] = doc.value;
      else obj[doc.key] = doc.value;
    });
    res.json(obj);
  } catch (err) {
    console.error("Site content GET error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/site-content/list", async (req, res) => {
  try {
    if (!isDbConnected()) return res.json([]);
    const list = await SiteContent.find().sort({ category: 1, key: 1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const uploadSingle = upload.single("file");
router.post("/api/site-content", (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: "Database not connected" });
    const key = (req.body.key || "").trim().replace(/\s+/g, "_");
    if (!key) return res.status(400).json({ error: "key required" });
    const type = req.body.type || "image";
    const category = req.body.category || "general";
    const label = req.body.label || key;
    let value = req.body.value || "";
    if (req.file) value = `/uploads/${req.file.filename}`;
    const existing = await SiteContent.findOne({ key });
    if (existing) {
      const updated = await SiteContent.findOneAndUpdate(
        { key },
        { value, type, category, label },
        { new: true }
      ).lean();
      return res.json(updated);
    }
    const doc = await SiteContent.create({ key, value, type, category, label });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/site-content/:key", async (req, res) => {
  try {
    const key = req.params.key;
    const { value, type, category, label } = req.body;
    const updated = await SiteContent.findOneAndUpdate(
      { key },
      { value: value ?? "", type, category, label },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/site-content/:key", async (req, res) => {
  try {
    const deleted = await SiteContent.findOneAndDelete({ key: req.params.key });
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
