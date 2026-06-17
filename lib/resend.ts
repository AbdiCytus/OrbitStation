import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY is missing. Mocking email:", { to, subject, html });
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Orbit Station <onboarding@resend.dev>", // Replace with your domain if verified
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}
