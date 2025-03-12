import { StorageProvider } from "./provider";
import { AwsS3Provider } from "./providers/aws-s3-provider";
import { LocalProvider } from "./providers/local-provider";
import { YandexCloudProvider } from "./providers/yandex-cloud-provider";
import { env } from "~/env";

export class StorageProviderFactory {
  static getProvider(): StorageProvider {
    const providerType = env.STORAGE_PROVIDER;

    switch (providerType) {
      case "aws":
        return new AwsS3Provider();
      case "local":
        return new LocalProvider();
      case "yandex":
        return new YandexCloudProvider();
      default:
        throw new Error(
          `Unsupported storage provider: ${String(providerType)}`,
        );
    }
  }
}
