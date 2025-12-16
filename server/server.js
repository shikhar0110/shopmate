import dotenv from "dotenv";

// MUST be first
dotenv.config({ path: "./config/config.env" });

// Quick environment sanity check (do NOT print secrets)
console.log(
  `Env loaded: DB_USER=${!!process.env.DB_USER}, DB_PASSWORD_SET=${!!process.env.DB_PASSWORD}, DB_HOST=${!!process.env.DB_HOST}, DB_DATABASE=${!!process.env.DB_DATABASE}, PORT=${process.env.PORT}`
);

// Extra diagnostics to debug missing env variables
import fs from "fs";
import path from "path";
const configRelPath = "./config/config.env";
const configAbsPath = path.resolve(process.cwd(), configRelPath);

if (fs.existsSync(configAbsPath)) {
  const filePreview = fs.readFileSync(configAbsPath, "utf8").split("\n").slice(0, 20).join("\n");

}

import app from "./app.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});