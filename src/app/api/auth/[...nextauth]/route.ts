import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { authStore } from "@/lib/auth-store";

const customAdapter: any = {
  createUser(user: any) {
    return authStore.createUser(user);
  },
  getUser(id: string) {
    return authStore.getUser(id);
  },
  getUserByEmail(email: string) {
    return authStore.getUserByEmail(email);
  },
  getUserByAccount(account: any) {
    return authStore.getUserByAccount(account);
  },
  updateUser(user: any) {
    return authStore.updateUser(user);
  },
  linkAccount(account: any) {
    return authStore.linkAccount(account);
  },
  createVerificationToken(params: any) {
    return authStore.createVerificationToken(params);
  },
  useVerificationToken(params: any) {
    return authStore.useVerificationToken(params);
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
      server: process.env.EMAIL_SERVER || process.env.SMTP_SERVER || "smtp://randomguywithbrain%40gmail.com:ggtrwfhjfkisrmmz@smtp.gmail.com:587",
      from: process.env.EMAIL_FROM || "randomguywithbrain@gmail.com",
      maxAge: 24 * 60 * 60, // 24 hours
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        console.log(`[NextAuth Magic Link Generated] Target: ${identifier}`);
        console.log(`[NextAuth Magic Link Direct URL]: ${url}`);

        let delivered = false;
        let smtpErrorMsg = "";

        // 2. Dispatch the email via Gmail SMTP (using port 587 with STARTTLS and 4s timeout)
        try {
          const nodemailer = await import("nodemailer");
          const emailUser = process.env.EMAIL_FROM || 'randomguywithbrain@gmail.com';
          const emailPass = process.env.EMAIL_PASS || 'ggtrwfhjfkisrmmz';

          const transport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 4000,
            tls: {
              rejectUnauthorized: false,
            },
          });

          await transport.sendMail({
            to: identifier,
            from: `HackGrid 2026 <${emailUser}>`,
            subject: 'Sign In to HackGrid 2026 • Campus Innovation Sprint',
            text: `Sign in to HackGrid 2026 using this link:\n\n${url}\n\nThis link is valid for 24 hours and can only be used once.\nIf you did not request this email, please ignore it.`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>HackGrid Sign-In</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                        <!-- Header Banner -->
                        <tr>
                          <td style="background-color: #0f172a; padding: 32px 40px; text-align: left;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td>
                                  <div style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
                                    CAMPUS INNOVATION SPRINT
                                  </div>
                                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                                    HackGrid 2026
                                  </h1>
                                  <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">
                                    PCCOE Secure Single Sign-On
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Content Body -->
                        <tr>
                          <td style="padding: 36px 40px;">
                            <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                              Sign in to your participant account
                            </h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                              We received a sign-in request for <strong style="color: #0f172a;">${identifier}</strong>. Click the secure button below to authenticate into the HackGrid portal:
                            </p>
                            
                            <!-- Action Button -->
                            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                              <tr>
                                <td align="center" style="border-radius: 12px; background-color: #2563eb;">
                                  <a href="${url}" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; letter-spacing: 0.02em;">
                                    Sign In to HackGrid Portal &rarr;
                                  </a>
                                </td>
                              </tr>
                            </table>

                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
                                <strong>Fallback Link:</strong> If the button above does not work, copy and paste this address into your browser:
                              </p>
                              <p style="color: #2563eb; font-size: 11px; word-break: break-all; margin: 0; font-family: monospace;">
                                ${url}
                              </p>
                            </div>

                            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                              <strong>Security Note:</strong> This link is single-use and will automatically expire in 24 hours. If you did not request this authentication link, you can safely disregard this email.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                              Pimpri Chinchwad College of Engineering &bull; DevOps & SRE Portal 2026
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });
          delivered = true;
          console.log(`[NextAuth Magic Link] Email successfully dispatched to ${identifier} via Gmail SMTP.`);
        } catch (mailError: any) {
          smtpErrorMsg = mailError?.code === 'ETIMEDOUT' || mailError?.message?.includes('ETIMEDOUT')
            ? "Campus network / firewall blocked outgoing SMTP (port 587/465). Use instant sign-in link below."
            : (mailError?.message || "SMTP dispatch failed");
          console.warn(`[NextAuth Magic Link] SMTP dispatch notice: ${smtpErrorMsg}`);
        }

        // Persist the generated verification link with delivery status
        authStore.setLatestMagicLink(identifier, url, delivered, smtpErrorMsg);
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "hackgrid-nextauth-session-secret-2026",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub || token.id;
        (session.user as any).email = token.email || session.user.email;
        if (!session.user.name && session.user.email) {
          session.user.name = session.user.email.split('@')[0];
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
