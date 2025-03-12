import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { type StorageProvider } from "../provider";
import { env } from "~/env";

export class YandexCloudProvider implements StorageProvider {
  private s3: S3Client;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor() {
    this.region = env.STORAGE_YANDEX_REGION ?? "ru-central1";
    this.bucketName = env.STORAGE_YANDEX_BUCKET_NAME!;
    this.endpoint =
      env.STORAGE_YANDEX_ENDPOINT ?? "https://storage.yandexcloud.net";

    this.s3 = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: env.STORAGE_YANDEX_ACCESS_KEY!,
        secretAccessKey: env.STORAGE_YANDEX_SECRET_KEY!,
      },
      forcePathStyle: env.STORAGE_YANDEX_FORCE_PATH_STYLE === "true",
    });
  }

  async uploadFile({
    buffer,
    key,
    contentType,
    makePublic = true,
  }: {
    buffer: Buffer;
    key: string;
    contentType: string;
    makePublic?: boolean;
  }): Promise<{ url: string; key: string }> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: makePublic ? "public-read" : undefined,
      }),
    );

    const url = env.STORAGE_YANDEX_URL_FORMAT
      ? env.STORAGE_YANDEX_URL_FORMAT.replace(
          "{bucket}",
          this.bucketName,
        ).replace("{key}", key)
      : `${this.endpoint.replace(/\/$/, "")}/${this.bucketName}/${key}`;

    return { url, key };
  }
}
