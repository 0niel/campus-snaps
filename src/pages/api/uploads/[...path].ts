import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { env } from "~/env";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePath } = req.query;

  const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

  const fullPath = path.join(env.STORAGE_LOCAL_PATH, ...filePathArray);

  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(path.resolve(env.STORAGE_LOCAL_PATH))) {
    return res.status(403).end("Forbidden");
  }

  try {
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).end("File not found");
    }

    const stat = fs.statSync(normalizedPath);

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    const fileStream = fs.createReadStream(normalizedPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving file:", error);
    return res.status(500).end("Internal Server Error");
  }
}
