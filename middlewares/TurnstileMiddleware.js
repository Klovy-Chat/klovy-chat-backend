import fetch from "node-fetch";

export const verifyTurnstileToken = async (req, res, next) => {
  const token = req.body.turnstileToken;

  if (!token) {
    return res.status(400).json({ error: "Turnstile token is required" });
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      },
    );

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: "Invalid Turnstile token" });
    }

    next();
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return res.status(500).json({ error: "Failed to verify Turnstile token" });
  }
};
