import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { type StorageProvider } from "../provider";
import { env } from "~/env";

export class AwsS3Provider implements StorageProvider {
  private s3: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = env.STORAGE_AWS_REGION!;
    this.bucketName = env.STORAGE_AWS_BUCKET_NAME!;

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: env.STORAGE_AWS_ACCESS_KEY!,
        secretAccessKey: env.STORAGE_AWS_SECRET_KEY!,
      },
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

    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    return { url, key };
  }
}
