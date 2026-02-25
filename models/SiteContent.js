const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" },
    type: { type: String, enum: ["image", "text", "link"], default: "image" },
    category: { type: String, default: "general" },
    label: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
