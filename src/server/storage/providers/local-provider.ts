import fs from "fs/promises";
import path from "path";
import { StorageProvider } from "../provider";
import { env } from "~/env";

export class LocalProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = env.STORAGE_LOCAL_PATH;
    this.baseUrl = env.NEXT_PUBLIC_APP_URL;

    void this.ensureDirectoryExists(this.uploadDir);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async uploadFile({
    buffer,
    key,
    contentType,
  }: {
    buffer: Buffer;
    key: string;
    contentType: string;
    makePublic?: boolean;
  }): Promise<{ url: string; key: string }> {
    const filePath = path.join(this.uploadDir, key);
    const directory = path.dirname(filePath);

    await this.ensureDirectoryExists(directory);
    await fs.writeFile(filePath, buffer);

    const url = `${this.baseUrl}/uploads/${key}`;

    return { url, key };
  }
}
