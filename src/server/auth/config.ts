import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { env } from "~/env";
import { db } from "~/server/db";
import { VerificationService } from "./verification-service";

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
export const authConfig = {
  providers: [
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,

      async generateVerificationToken() {
        return VerificationService.generateCode();
      },

      async sendVerificationRequest({ identifier, url, provider, token }) {
        const domain = identifier.split("@")[1];

        if (domain !== "mirea.ru" && domain !== "edu.mirea.ru") {
          throw new Error(
            "Только домены @mirea.ru и @edu.mirea.ru разрешены для регистрации",
          );
        }

        const hasRecent = await VerificationService.hasRecentToken(identifier);
        if (hasRecent) {
          const remainingSeconds =
            await VerificationService.getRemainingTime(identifier);
          throw new Error(
            `Пожалуйста, подождите ${remainingSeconds} секунд перед запросом нового кода`,
          );
        }

        await VerificationService.createToken(identifier, token);

        const escapedToken = token;

        const emailTemplate = `
          <div style="background-color: #f6f7f9; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1a56db; text-align: center; margin-bottom: 20px;">Campus Snaps</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Здравствуйте! Ваш код для входа в систему Campus Snaps:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                  ${escapedToken}
                </div>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                Код действителен в течение 10 минут. Если вы не запрашивали код, просто проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `;

        try {
          const transport = nodemailer.createTransport({
            host: provider.server.host,
            port: provider.server.port,
            secure: provider.server.port === 465,
            auth: {
              user: provider.server.auth.user,
              pass: provider.server.auth.pass,
            },
          });

          const result = await transport.sendMail({
            from: provider.from,
            to: identifier,
            subject: "Код подтверждения для Campus Snaps",
            html: emailTemplate,
          });

          console.log(`Email sent to ${identifier}: ${result.messageId}`);
        } catch (error) {
          console.error("Error sending verification email:", error);
          throw new Error("Ошибка отправки письма подтверждения");
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("JWT callback", { token, user, account, profile, isNewUser });

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.academicGroupId = user.academicGroupId;
      }

      return token;
    },

    async session({ session, token, user }) {
      console.log("Session callback", { session, token, user });

      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          academicGroupId: token.academicGroupId as number | null,
        };
      }

      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log("Sign in event", message);
    },
    async linkAccount(message) {
      console.log("Link account event", message);
    },
    async session(message) {
      console.log("Session event", message);
    },
  },
} satisfies NextAuthConfig;
