"use node";

import escapeHtml from "escape-html";
import { Hercules } from "@usehercules/sdk";
import { v, ConvexError } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

const hercules = new Hercules({
  apiKey: process.env.HERCULES_API_KEY!,
  apiVersion: "2025-12-09",
});

// Sender email must be verified in Hercules Emails tab
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL ?? "newsletter@example.com";

export const sendWelcomeEmail = internalAction({
  args: { to: v.string() },
  handler: async (_ctx, { to }) => {
    await hercules.email.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to the Afro Eats Newsletter! 🍲",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #7c3e0e; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 2px;">AFRO EATS</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">THE TASTE OF AFRICA</p>
          </div>
          <div style="background: #fffbf7; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5d5c5;">
            <h2 style="color: #7c3e0e; margin-top: 0;">You're subscribed!</h2>
            <p style="color: #555; line-height: 1.7;">
              Thank you for joining the Afro Eats newsletter. Get ready to receive the best African recipes,
              food stories, and culinary guides straight to your inbox.
            </p>
            <p style="color: #555; line-height: 1.7;">
              From smoky jollof to injera feasts — we'll keep you connected to the soul of African cuisine.
            </p>
            <p style="color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #e5d5c5; padding-top: 16px;">
              You subscribed with <strong>${escapeHtml(to)}</strong>. 
              If this was a mistake, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    });
  },
});

export const sendBroadcast = action({
  args: {
    subject: v.string(),
    body: v.string(),
    postTitle: v.optional(v.string()),
    postUrl: v.optional(v.string()),
  },
  handler: async (ctx, { subject, body, postTitle, postUrl }): Promise<{ sent: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });

    const subscribers = await ctx.runQuery(internal.subscribers.adminListInternal);

    if (subscribers.length === 0) return { sent: 0 };

    const emails: string[] = subscribers.map((s) => s.email);

    const postSection = postTitle && postUrl
      ? `
        <div style="background: #fff8f3; border-left: 4px solid #7c3e0e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #7c3e0e;">New Post: ${escapeHtml(postTitle)}</p>
          <a href="${escapeHtml(postUrl)}" style="color: #7c3e0e; font-size: 14px;">Read now →</a>
        </div>
      `
      : "";

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #7c3e0e; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 2px;">AFRO EATS</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">THE TASTE OF AFRICA</p>
        </div>
        <div style="background: #fffbf7; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5d5c5;">
          <p style="color: #555; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(body)}</p>
          ${postSection}
          <p style="color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #e5d5c5; padding-top: 16px;">
            You're receiving this because you subscribed to Afro Eats newsletter.
          </p>
        </div>
      </div>
    `;

    // Send in batches of 50
    const BATCH = 50;
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH);
      await hercules.email.send({
        from: FROM_EMAIL,
        to: batch,
        subject: escapeHtml(subject),
        html,
      });
    }

    await ctx.runMutation(internal.subscribers.markBroadcastSent, { count: emails.length });

    return { sent: emails.length };
  },
});
