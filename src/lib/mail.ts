import nodemailer from 'nodemailer';
import { db } from '@/db';
import { emailQueue } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { CircuitBreaker } from './circuitBreaker';

// Helper to create Nodemailer Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true'; // true for 465, false for 587
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('WARNING: SMTP credentials (SMTP_USER/SMTP_PASS) are not set. Email triggers will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

// Instantiate Circuit Breaker for SMTP emails (Trips on 5 failures, 30s cooldown)
const emailBreaker = new CircuitBreaker<{ to: string; name: string; ref: string }, void>(
  'SMTP Email Provider',
  async (req, error) => {
    console.warn(`[DEGRADED FALLBACK] SMTP provider is offline. Skipping send for: ${req.to}. Error: ${error.message}`);
    // Throw error to ensure caller (persistent queue processor) logs failure attempts
    throw new Error(`SMTP Circuit Breaker is OPEN/Degraded. Original: ${error.message}`);
  },
  5,
  30000
);

/**
 * Sends a branded, premium confirmation email to the client in HTML format.
 * Throws exceptions to let caller manage task retries.
 */
export async function sendConfirmationEmail(toEmail: string, clientName: string, refCode: string) {
  return emailBreaker.execute(async (req) => {
    const transporter = getTransporter();
    if (!transporter) {
      throw new Error('Transporter not initialized due to missing SMTP credentials.');
    }

    const from = process.env.SMTP_FROM || `"Kōsh Table" <${process.env.SMTP_USER}>`;

    // Premium, brand-aligned HTML Email Template matching the Kōsh landing page theme
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Membership Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F7F4EE; font-family: 'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F7F4EE; padding: 48px 24px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D9CFC2; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(31, 39, 27, 0.03);">
                  
                  <!-- HEADER (Kōsh Forest Green) -->
                  <tr>
                    <td style="background-color: #1F271B; padding: 40px 32px; text-align: center;">
                      <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 36px; font-weight: 300; letter-spacing: 0.1em; color: #F7F4EE; text-transform: uppercase;">
                        Kō<span style="font-style: italic; color: #8B5A2B;">sh</span>
                      </h1>
                      <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 500; letter-spacing: 0.2em; color: #C8B99A; text-transform: uppercase;">
                        Membership Confirmed
                      </p>
                    </td>
                  </tr>

                  <!-- CONTENT -->
                  <tr>
                    <td style="padding: 48px 32px;">
                      <p style="margin: 0 0 16px 0; font-size: 16px; color: #16140F; line-height: 1.6;">
                        Dear ${req.name},
                      </p>
                      <p style="margin: 0 0 24px 0; font-size: 15px; color: #2E2B23; line-height: 1.6; font-weight: 300;">
                        We are thrilled to welcome you to the Kōsh Table cohort. Your onboarding application has been reviewed and officially <strong>confirmed</strong>.
                      </p>

                      <!-- REFERENCE BOX -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F7F4EE; border-left: 3px solid #8B5A2B; margin-bottom: 32px; border-radius: 4px;">
                        <tr>
                          <td style="padding: 18px 24px;">
                            <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #857568; margin-bottom: 4px;">
                              Your Membership Ref
                            </span>
                            <strong style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; color: #8B5A2B; letter-spacing: 0.05em;">
                              ${req.ref}
                            </strong>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 24px 0; font-size: 14px; color: #2E2B23; line-height: 1.6; font-weight: 300;">
                        Our kitchen is preparing your customized plan. Here is what you can expect next:
                      </p>
                      
                      <ol style="margin: 0 0 32px 0; padding-left: 20px; font-size: 14px; color: #2E2B23; line-height: 1.8; font-weight: 300;">
                        <li style="margin-bottom: 8px;"><strong>Calorie Target Alignment:</strong> Our culinary lead will set your micro-portion metrics based on the weight, height, and target goals you submitted.</li>
                        <li style="margin-bottom: 8px;"><strong>Delivery Window Booking:</strong> You will receive a separate invite containing delivery schedule preferences.</li>
                        <li><strong>Chef Personalization:</strong> Any dietary restrictions or palate preferences have been saved to your culinary profile.</li>
                      </ol>

                      <hr style="border: 0; border-top: 1px solid #EDE7DC; margin: 32px 0;" />

                      <p style="margin: 0; font-size: 12px; color: #857568; line-height: 1.6; font-style: italic; text-align: center;">
                        "Same kitchen. Same menu. Your portion is the only thing that changes."
                      </p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background-color: #F7F4EE; border-top: 1px solid #D9CFC2; padding: 24px 32px; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #857568; font-weight: 300; letter-spacing: 0.02em;">
                        Kōsh Table Onboarding &bull; Mumbai, India
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 11px; color: #857568; font-weight: 300;">
                        For support, please reply directly to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from,
        to: req.to,
        subject: `Confirmed: Your Kōsh Membership is Active (${req.ref})`,
        html: htmlContent
      });
      console.log(`[MAILER] Confirmation email successfully sent to ${req.to}.`);
    } catch (error) {
      console.error(`[MAILER] SMTP connection exception:`, error);
      throw error;
    }
  }, { to: toEmail, name: clientName, ref: refCode });
}

/**
 * Background processor that processes pending tasks in the database-backed persistent email queue.
 * Implements exponential backoff retries and max attempt caps (acting as DLQ).
 */
export async function processEmailQueue() {
  if (!db) {
    console.warn('[QUEUE] Database client not initialized. Skipping email queue processing.');
    return;
  }

  // Fetch queue items that are pending or failed and have not exceeded 5 attempts
  const pendingTasks = await db
    .select()
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.status, 'pending'),
        lt(emailQueue.attempts, 5)
      )
    );

  if (pendingTasks.length === 0) return;

  console.log(`[QUEUE] Found ${pendingTasks.length} pending email task(s) to process.`);

  for (const task of pendingTasks) {
    // Increment attempts immediately to serialize execution and lock task
    await db
      .update(emailQueue)
      .set({
        attempts: task.attempts + 1,
        lastAttemptAt: new Date()
      })
      .where(eq(emailQueue.id, task.id));

    try {
      await sendConfirmationEmail(task.email, task.name, task.ref);
      
      // Update task status to sent
      await db
        .update(emailQueue)
        .set({
          status: 'sent',
          errorMessage: null
        })
        .where(eq(emailQueue.id, task.id));
    } catch (err: any) {
      console.error(`[QUEUE PROCESSOR TASK FAILURE] Failed task ID ${task.id} (Attempt ${task.attempts + 1}/5):`, err);
      
      // Update task with failure details
      await db
        .update(emailQueue)
        .set({
          status: 'pending', // Keep pending so it retries, but attempts count prevents infinite looping
          errorMessage: err.message || 'Unknown queue task failure'
        })
        .where(eq(emailQueue.id, task.id));
    }
  }
}
