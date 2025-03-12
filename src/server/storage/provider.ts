export interface StorageProvider {
  uploadFile(params: {
    buffer: Buffer;
    key: string;
    contentType: string;
    makePublic?: boolean;
  }): Promise<{ url: string; key: string }>;
}

export interface StorageProviderConfig {
  type: string;
  [key: string]: unknown;
}
