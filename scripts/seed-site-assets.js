/**
 * Seed site content (logos, section images) into DB.
 * Run from backend: node scripts/seed-site-assets.js
 * Requires: MONGODB_URI in .env, and frontend at ../frontend (repo root = backend's parent)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const BACKEND_DIR = path.join(__dirname, "..");
const ROOT_DIR = path.join(BACKEND_DIR, "..");
const FRONTEND_IMAGES = path.join(ROOT_DIR, "frontend", "src", "Components", "images");
const UPLOADS_DIR = path.join(BACKEND_DIR, "uploads");

const ASSET_MAP = {
  header_logo: "Logooo.png",
  footer_logo: "Logooo.png",
  home_banner: "bgimg.jpg",
  contact_hero: "Contact.jpg",
  contact_map_india: "idnlocation.png",
  contact_map_usa: "usalocation.png",
  contact_map_uae: "uaelocation.png",
  about_group: "group.png",
  about_bg: "bg.png",
  about_shadow: "shadow.png",
  about_about2: "about2.png",
  about_purpose: "purpose.png",
  about_vision: "vision.png",
  about_mission: "mission.png",
  about_values: "values.png",
  vision_gif: "vision-1.gif",
  industry_retail: "retail.jpg",
  industry_fmcg: "fmgc.jpg",
  industry_3pl: "3pll.jpg",
  industry_ecom: "e-commerce.jpg",
  industry_manu: "manu.jpg",
  industry_pharma: "pharmace.jpg",
  industry_auto: "automative.jpg",
  industry_food: "foodbev.jpg",
  card_sap60: "sap60.svg",
  card_sapbtp: "sapbtp.svg",
  card_sapmfs: "sapmfs.svg",
  card_saptm: "saptm.svg",
  card_yardlogistics: "yard-logistics.svg",
  client_kpmg: "kpmg.jpg",
  client_colgate: "colgate.jpg",
  client_innovapptive: "innovaptive.jpg",
  client_merck: "Merk-2.jpg",
  client_techmahindra: "tech.jpg",
  client_vishal: "VMM-1.png",
  client_ltm: "LTM.png",
  client_phoenix: "phonex.jpg",
  client_infokrafts: "infokrafts.svg",
  client_techwave: "techwave.jpg",
  client_nttdata: "NTT.png",
  client_lohiacorp: "Lohiacorp.png",
  client_danfoss: "danfoss.png",
  client_kagool: "kagool.png",
  client_yash: "yashh.jpeg",
  client_accenture: "accenture.png",
  client_capgemini: "capgemini.png",
  client_franke: "Franke.png",
  client_somany: "somany.png",
  client_majid: "majid-al-futtaim.png",
  client_element: "element.png",
  client_kito: "kitoo.png",
  client_selig: "seliggroup.png",
  client_daikin: "daikin.png",
  client_fusion: "fusion.png",
  client_vishalairplaza: "vishalairplaza.png",
  client_bajaj: "bajaj.png",
  client_johnkeelles: "johnkeelles.png",
  client_ibm: "ibm.png",
  client_stellium: "stellium.png",
  client_pwc: "pwc.png",
  leadership_ckreddy: "ck-reddy.jpg",
  leadership_narareddy: "Muralidhar Reddy_.jpg",
  leadership_harireddy: "Harinath Reddy-.jpg",
  leadership_surendra: "surendra Gondipalli-.jpg",
  leadership_kalyan: "kalyan-nese.jpg",
  leadership_venkat: "venkat-tangirala.jpg",
  leadership_syamareddy: "syam-sundar-Reddy-.jpg",
  leadership_sudhakar: "sudhakar.jpg",
  leadership_muralireddy: "Muralidhar Reddy_.jpg",
  leadership_bhanu: "bhanu.jpg",
  section_contact: "Contact.jpg",
  section_header: "header.jpg",
  section_shadow: "shadow.png",
};

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }
  if (!fs.existsSync(FRONTEND_IMAGES)) {
    console.error("Frontend images dir not found:", FRONTEND_IMAGES);
    process.exit(1);
  }
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  await mongoose.connect(process.env.MONGODB_URI);
  const SiteContent = require("../models/SiteContent");

  let created = 0;
  let skipped = 0;
  for (const [key, filename] of Object.entries(ASSET_MAP)) {
    const srcPath = path.join(FRONTEND_IMAGES, filename);
    if (!fs.existsSync(srcPath)) {
      console.warn("Skip (file not found):", key, srcPath);
      skipped++;
      continue;
    }
    const ext = path.extname(filename);
    const destName = `site-${key}${ext}`;
    const destPath = path.join(UPLOADS_DIR, destName);
    fs.copyFileSync(srcPath, destPath);
    const value = `/uploads/${destName}`;
    await SiteContent.findOneAndUpdate(
      { key },
      { key, value, type: "image", category: key.split("_")[0], label: key },
      { upsert: true, new: true }
    );
    console.log("OK:", key, "->", value);
    created++;
  }

  console.log("\nDone. Created/updated:", created, "Skipped:", skipped);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
