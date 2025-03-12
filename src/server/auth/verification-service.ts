import { db } from "~/server/db";

export class VerificationService {
  private static readonly COOLDOWN_SECONDS = 15;

  /**
   * Generates a random 6-digit verification code
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Creates a verification token in the database
   */
  static async createToken(
    identifier: string,
    token: string,
    expiresIn = 10,
  ): Promise<void> {
    const expires = new Date(Date.now() + expiresIn * 60 * 1000);

    try {
      await db.verificationToken.deleteMany({
        where: { identifier },
      });

      await db.verificationToken.create({
        data: {
          identifier,
          token,
          expires,
          attempts: 0,
        },
      });

      console.log(
        `Created token for ${identifier}: ${token}, expires: ${expires.toISOString()}`,
      );
    } catch (error) {
      console.error("Error creating verification token:", error);
      throw error;
    }
  }

  /**
   * Verifies a token and returns true if valid, false otherwise
   * IMPORTANT: Changed to not delete the token so NextAuth can handle deletion
   */
  static async verifyToken(
    identifier: string,
    token: string,
  ): Promise<boolean> {
    console.log(`Verifying token: ${token} for ${identifier}`);

    try {
      const allTokens = await db.verificationToken.findMany({
        where: { identifier },
      });
      console.log(
        `Found ${allTokens.length} tokens for ${identifier}:`,
        allTokens.map((t) => ({ token: t.token, expires: t.expires })),
      );

      const verificationToken = await db.verificationToken.findFirst({
        where: {
          identifier,
          token,
        },
      });

      console.log("Found matching token:", verificationToken);

      if (!verificationToken) {
        const existingToken = await db.verificationToken.findFirst({
          where: { identifier },
        });

        if (existingToken) {
          await db.verificationToken.update({
            where: {
              identifier_token: {
                identifier: existingToken.identifier,
                token: existingToken.token,
              },
            },
            data: {
              attempts: {
                increment: 1,
              },
            },
          });

          if (existingToken.attempts >= 4) {
            await db.verificationToken.delete({
              where: {
                identifier_token: {
                  identifier: existingToken.identifier,
                  token: existingToken.token,
                },
              },
            });
          }
        }

        console.log("Token verification failed: token not found or mismatch");
        return false;
      }

      if (verificationToken.expires < new Date()) {
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        console.log("Token verification failed: token expired");
        return false;
      }

      if (verificationToken.attempts >= 5) {
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        console.log("Token verification failed: too many attempts");
        return false;
      }
      console.log(
        "Token verification successful - leaving token for NextAuth to handle",
      );
      return true;
    } catch (error) {
      console.error("Error verifying token:", error);
      return false;
    }
  }

  /**
   * Check if a recent token exists for the identifier
   * We check based on creation time rather than expiration
   */
  static async hasRecentToken(identifier: string): Promise<boolean> {
    try {
      const token = await db.verificationToken.findFirst({
        where: {
          identifier,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!token) return false;

      const now = new Date();
      const createdAt = token.createdAt;
      const diffMs = now.getTime() - createdAt.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      return diffSec < this.COOLDOWN_SECONDS;
    } catch (error) {
      console.error("Error checking for recent token:", error);
      return false;
    }
  }

  /**
   * Get remaining time in seconds for the latest token
   */
  static async getRemainingTime(identifier: string): Promise<number> {
    try {
      const token = await db.verificationToken.findFirst({
        where: { identifier },
        orderBy: { createdAt: "desc" },
      });

      if (!token) return 0;

      const now = new Date();
      const createdAt = token.createdAt;
      const diffMs = now.getTime() - createdAt.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      const remainingSeconds = this.COOLDOWN_SECONDS - diffSec;
      return Math.max(0, remainingSeconds);
    } catch (error) {
      console.error("Error getting remaining time:", error);
      return 0;
    }
  }

  /**
   * For development only: get the latest code for an email
   */
  static async getLatestCodeForEmail(email: string): Promise<string | null> {
    if (process.env.NODE_ENV !== "development") {
      console.error("This method should only be used in development");
      return null;
    }

    try {
      const token = await db.verificationToken.findFirst({
        where: { identifier: email },
        orderBy: { createdAt: "desc" },
      });

      if (!token) return null;

      return token.token;
    } catch (error) {
      console.error("Error getting latest code:", error);
      return null;
    }
  }
}
