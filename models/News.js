const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
