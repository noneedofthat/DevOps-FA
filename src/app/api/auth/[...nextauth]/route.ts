import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";

// In-memory persistent adapter for NextAuth verification tokens and user sessions
const memoryUsers = new Map<string, any>();
const memoryAccounts = new Map<string, any>();
const memoryVerificationTokens = new Map<string, any>();

const customAdapter: any = {
  async createUser(user: any) {
    const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser = { ...user, id };
    memoryUsers.set(id, newUser);
    return newUser;
  },
  async getUser(id: string) {
    return memoryUsers.get(id) || null;
  },
  async getUserByEmail(email: string) {
    for (const u of memoryUsers.values()) {
      if (u.email === email) return u;
    }
    return null;
  },
  async getUserByAccount({ provider, providerAccountId }: any) {
    const key = `${provider}:${providerAccountId}`;
    const account = memoryAccounts.get(key);
    if (!account) return null;
    return memoryUsers.get(account.userId) || null;
  },
  async updateUser(user: any) {
    const existing = memoryUsers.get(user.id) || {};
    const updated = { ...existing, ...user };
    memoryUsers.set(user.id, updated);
    return updated;
  },
  async linkAccount(account: any) {
    const key = `${account.provider}:${account.providerAccountId}`;
    memoryAccounts.set(key, account);
    return account;
  },
  async createVerificationToken({ identifier, expires, token }: any) {
    const key = `${identifier}:${token}`;
    const tokenObj = { identifier, expires, token };
    memoryVerificationTokens.set(key, tokenObj);
    return tokenObj;
  },
  async useVerificationToken({ identifier, token }: any) {
    const key = `${identifier}:${token}`;
    const tokenObj = memoryVerificationTokens.get(key);
    if (tokenObj) {
      memoryVerificationTokens.delete(key);
      return tokenObj;
    }
    return null;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "hackgrid-github-client-id",
      clientSecret: process.env.GITHUB_SECRET || "hackgrid-github-client-secret",
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER || process.env.SMTP_SERVER || "smtp://user:password@smtp.hackgrid.internal:587",
      from: process.env.EMAIL_FROM || "noreply@hackgrid.internal",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          const nodemailer = await import("nodemailer");
          const emailServer = process.env.EMAIL_SERVER || provider.server;
          const isGmail = typeof emailServer === 'string' && emailServer.includes('gmail.com');
          const transport = isGmail
            ? nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.EMAIL_FROM || 'randomguywithbrain@gmail.com',
                  pass: process.env.EMAIL_PASS || 'ggtrwfhjfkisrmmz',
                },
              })
            : nodemailer.createTransport(emailServer);
          await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: 'Sign in to HackGrid Portal',
            text: `Sign in to HackGrid using this secure link:\n\n${url}\n\nIf you did not request this email, you can safely ignore it.`,
            html: `
              <div style="background-color: #f8fafc; padding: 24px; font-family: sans-serif;">
                <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Sign in to HackGrid</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Click the button below to sign in to your HackGrid account. This secure magic link is valid for 24 hours.</p>
                  <p style="margin: 28px 0;">
                    <a href="${url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Sign In to HackGrid</a>
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">If you did not request this link, you can safely ignore this message.</p>
                </div>
              </div>
            `,
          });
          console.log(`[NextAuth Magic Link] Email dispatched to ${identifier}`);
        } catch (mailError) {
          console.error(`[NextAuth Magic Link] SMTP dispatch failed:`, mailError);
          console.log(`[NextAuth Magic Link Fallback Link]: ${url}`);
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "hackgrid-nextauth-session-secret-2026",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
