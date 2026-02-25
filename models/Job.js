const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    employmentType: { type: String, default: "Full Time" },
    salaryRange: { type: String, default: "" },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
