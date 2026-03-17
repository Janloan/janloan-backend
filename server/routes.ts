import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // POST /api/send-otp
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { mobile } = req.body;

      if (!mobile || mobile.length < 10) {
        return res.status(400).json({ success: false, message: "Please provide a valid mobile number." });
      }

      const formattedMobile = mobile.startsWith("91") ? mobile : `91${mobile}`;

      const apiKey = process.env.MSG91_API_KEY;
      const templateId = process.env.MSG91_TEMPLATE_ID;

      if (!apiKey || !templateId) {
        log("MSG91 credentials not configured", "otp");
        return res.status(500).json({ success: false, message: "OTP service is not configured." });
      }

      const response = await fetch(
        `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${formattedMobile}`,
        {
          method: "POST",
          headers: {
            "authkey": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      log(`MSG91 send-otp response: ${JSON.stringify(data)}`, "otp");

      if (data.type === "success" || data.type === "Success") {
        return res.json({ success: true, message: "OTP sent successfully." });
      } else {
        return res.status(400).json({ success: false, message: data.message || "Failed to send OTP." });
      }
    } catch (error: any) {
      log(`Send OTP error: ${error.message}`, "otp");
      return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
    }
  });

  // POST /api/verify-otp
  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { mobile, otp } = req.body;

      if (!mobile || !otp) {
        return res.status(400).json({ success: false, message: "Mobile number and OTP are required." });
      }

      const formattedMobile = mobile.startsWith("91") ? mobile : `91${mobile}`;

      const apiKey = process.env.MSG91_API_KEY;

      if (!apiKey) {
        log("MSG91 API key not configured", "otp");
        return res.status(500).json({ success: false, message: "OTP service is not configured." });
      }

      const response = await fetch(
        `https://control.msg91.com/api/v5/otp/verify?mobile=${formattedMobile}&otp=${otp}`,
        {
          method: "POST",
          headers: {
            "authkey": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      log(`MSG91 verify-otp response: ${JSON.stringify(data)}`, "otp");

      if (data.type === "success" || data.type === "Success") {
        return res.json({ success: true, message: "OTP verified successfully." });
      } else {
        return res.status(400).json({ success: false, message: data.message || "Invalid OTP." });
      }
    } catch (error: any) {
      log(`Verify OTP error: ${error.message}`, "otp");
      return res.status(500).json({ success: false, message: "OTP verification failed. Please try again." });
    }
  });

  return httpServer;
}
