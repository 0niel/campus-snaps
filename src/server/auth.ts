import NextAuth from "next-auth";
import { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { env } from "~/env";
import { db } from "~/server/db";
import { VerificationService } from "./auth/verification-service";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      academicGroupId: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    academicGroupId: number | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const config = {
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("📣 Sign in callback:", {
        user,
        account,
        email,
        credentials,
      });

      if (
        account?.provider === "email" &&
        credentials?.token &&
        credentials?.email
      ) {
        try {
          console.log(
            `🔐 Verifying token: ${credentials.token} for ${credentials.email}`,
          );
          const isValid = await VerificationService.verifyToken(
            credentials.email as string,
            credentials.token as string,
          );

          if (isValid) {
            console.log(
              "✅ Token verification successful! Continuing to authentication.",
            );
            return true;
          } else {
            console.log("❌ Token verification failed");
            return false;
          }
        } catch (error) {
          console.error("❌ Error verifying token:", error);
          return false;
        }
      } else if (
        account?.provider === "email" &&
        email?.verificationRequest === true
      ) {
        console.log("📧 Email verification request - allowing normal flow");
        return true;
      }

      console.log(
        "⚠️ Default case in signIn callback - allowing authentication",
      );

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        console.log("📝 Adding user data to JWT:", user);
        token.id = user.id;
        token.role = user.role;
        token.academicGroupId = user.academicGroupId;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      console.log("🔄 Session callback:", { sessionUser: session.user, token });

      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "STUDENT";
        session.user.academicGroupId = token.academicGroupId as number | null;

        if (token.email) {
          session.user.email = token.email as string;
        }
      }

      return session;
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
        secure: env.EMAIL_SERVER_PORT === 465,
      },
      from: env.EMAIL_FROM,

      async generateVerificationToken() {
        return VerificationService.generateCode();
      },

      async sendVerificationRequest({ identifier, url, provider, token }) {
        try {
          console.log(
            `📧 Processing email verification request for: ${identifier}`,
          );
          console.log(`🔗 URL: ${url}`);

          const urlObj = new URL(url);
          const urlHasToken = urlObj.searchParams.has("token");

          if (urlHasToken) {
            console.log(
              "🔄 URL contains token - this appears to be a verification attempt, skipping cooldown check",
            );
          }

          if (
            process.env.NODE_ENV === "development" ||
            identifier.endsWith("@mirea.ru") ||
            identifier.endsWith("@edu.mirea.ru")
          ) {
            if (!urlHasToken) {
              const hasRecent =
                await VerificationService.hasRecentToken(identifier);
              const remainingSeconds = hasRecent
                ? await VerificationService.getRemainingTime(identifier)
                : 0;
              if (hasRecent && remainingSeconds > 5) {
                throw new Error(
                  `Пожалуйста, подождите ${remainingSeconds} секунд перед запросом нового кода`,
                );
              }
            }

            await VerificationService.createToken(identifier, token);

            const emailTemplate = `
              <div style="background-color: #f6f7f9; padding: 20px; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #1a56db; text-align: center; margin-bottom: 20px;">Campus Snaps</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    Здравствуйте! Ваш код для входа в систему Campus Snaps:
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                      ${token}
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                    Код действителен в течение 10 минут. Если вы не запрашивали код, просто проигнорируйте это письмо.
                  </p>
                </div>
              </div>
            `;

            console.log(`
              =================================================================
              📧 VERIFICATION CODE FOR ${identifier}: ${token}
              =================================================================
            `);

            try {
              const transporter = nodemailer.createTransport({
                host: provider.server.host,
                port: provider.server.port as number,
                secure: provider.server.secure as boolean,
                auth: {
                  user: provider.server.auth.user,
                  pass: provider.server.auth.pass,
                },
              });

              const info = await transporter.sendMail({
                from: provider.from,
                to: identifier,
                subject: "Код подтверждения для Campus Snaps",
                html: emailTemplate,
              });

              console.log(
                `📨 Email sent to ${identifier}, messageId: ${info.messageId}`,
              );
            } catch (emailError) {
              console.error("❌ Failed to send email:", emailError);

              console.log(`✓ Code ${token} is still valid for ${identifier}`);
            }
          } else {
            throw new Error(
              "Только домены @mirea.ru и @edu.mirea.ru разрешены для регистрации",
            );
          }
        } catch (error) {
          console.error("❌ Error in verification process:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};

/**
 * Create NextAuth.js handler
 */
export const { handlers, auth, signIn, signOut } = NextAuth(config);

/**
 * Wrapper for `getServerSession` so that you don't need to import the config in every file.
 */
export const getServerAuthSession = auth;
