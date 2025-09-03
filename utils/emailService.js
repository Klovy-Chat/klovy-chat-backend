import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (
  !process.env.EMAIL_PASSWORD &&
  !process.env.EMAIL_ADDRESS &&
  !process.env.EMAIL_HOST
) {
  throw new Error(
    "EMAIL_PASSWORD, EMAIL_ADDRESS, and EMAIL_HOST environment variables are required but not provided",
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendResetPasswordEmail = async (to, resetToken) => {
  const resetUrl = `https://chat.klovy.org/auth/reset-password/${resetToken}`;
  const mailOptions = {
    from: "Klovy Chat <noreply@klovy.org>",
    to: to,
    subject: "Reset your Klovy Chat password",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 4px rgba(0,0,0,0.05);">
          
          <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Reset password</p>
          
          <h2 style="margin-top: 0; font-size: 22px; color: #111;">Reset your password</h2>
          
          <p style="font-size: 15px; color: #333;">
            We received a request to reset the password for your Klovy Chat account. To set a new password, click the button below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset your password
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">Alternatively, you can copy and paste the following URL into your browser:</p>

          <pre style="background: #f2f2f2; padding: 10px; font-size: 13px; overflow-wrap: break-word; border-radius: 5px; color: #333;">
${resetUrl}
          </pre>

          <div style="background: #f2f2f2; padding: 15px; margin-top: 30px; border-radius: 5px; color: #444; font-size: 14px;">
            This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this message.
          </div>

          <p style="font-size: 13px; color: #777; margin-top: 30px;">
            If you have any questions or need help, please contact our support team at 
            <a href="mailto:support@klovy.org" style="color: #000; font-weight: bold;">support@klovy.org</a>.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 11px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} Klovy Chat. All rights reserved.<br>
          </p>

        </div>
      </div>
      `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset password email");
  }
};

export const sendVerificationEmail = async (to, verificationToken) => {
  const verifyUrl = `https://chat.klovy.org/auth/verify-email/${verificationToken}`;
  const mailOptions = {
    from: "Klovy Chat <noreply@klovy.org>",
    to: to,
    subject: "Verify your Klovy Chat account",
    html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 4px rgba(0,0,0,0.05);">
            <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Email verification</p>
            <h2 style="margin-top: 0; font-size: 22px; color: #111;">Verify your account</h2>
            <p style="font-size: 15px; color: #333;">
              Thank you for registering in Klovy Chat! To activate your account, click the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify your account
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Alternatively, you can copy and paste the following URL into your browser:</p>
            <pre style="background: #f2f2f2; padding: 10px; font-size: 13px; overflow-wrap: break-word; border-radius: 5px; color: #333;">${verifyUrl}</pre>
            <div style="background: #f2f2f2; padding: 15px; margin-top: 30px; border-radius: 5px; color: #444; font-size: 14px;">
              This link is valid for 24 hours. If you did not create an account, you can safely ignore this message.
            </div>
            <p style="font-size: 13px; color: #777; margin-top: 30px;">
              If you have any questions or need help, please contact our support team at 
              <a href="mailto:support@klovy.org" style="color: #000; font-weight: bold;">support@klovy.org</a>.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 11px; color: #999; text-align: center;">
              &copy; ${new Date().getFullYear()} Klovy Chat. All rights reserved.<br>
            </p>
          </div>
        </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};
