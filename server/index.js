const express = require('express');
const cors = require('cors');
let sgMail = null;
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const OTP_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory store of OTPs: { email -> { otp, exp } }
const otps = new Map();

let smtpTransporter = null;
if (process.env.SENDGRID_API_KEY) {
  // require SendGrid only when an API key is provided
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid configured. Emails will be sent for OTPs.');
  } catch (e) {
    console.error('Failed to load @sendgrid/mail:', e.message);
    sgMail = null;
  }
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Configure Nodemailer SMTP transporter (free option: Gmail app password or other SMTP)
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('SMTP configured. Emails will be sent using Nodemailer SMTP.');
} else {
  console.log('No SendGrid or SMTP configured. OTPs will be printed to the server console (dev mode).');
}

app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(email, { otp, exp: Date.now() + OTP_TTL });

    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Your admin OTP',
        text: `Your one-time code: ${otp} (valid for 5 minutes)`
      };
      await sgMail.send(msg);
      return res.json({ success: true });
    }

    if (smtpTransporter && process.env.FROM_EMAIL) {
      // Use Nodemailer to send via SMTP
      await smtpTransporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your admin OTP',
        text: `Your one-time code: ${otp} (valid for 5 minutes)`
      });
      return res.json({ success: true });
    }

    // Dev fallback: return the otp in the response and log it
    console.log(`Dev OTP for ${email}: ${otp}`);
    return res.json({ success: true, otp });
  } catch (err) {
    console.error('send-otp error', err);
    return res.status(500).json({ error: 'failed to send otp' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

    const rec = otps.get(email);
    if (!rec || rec.otp !== otp || rec.exp < Date.now()) {
      return res.status(400).json({ error: 'invalid or expired otp' });
    }

    // valid otp, remove it
    otps.delete(email);

    // Create a base64 token payload similar to client mock
    const role = (email === (process.env.ADMIN_EMAIL || 'mthavasi085@gmail.com')) ? 'admin' : 'user';
    const payload = { id: role === 'admin' ? '1' : '2', username: email, role, exp: Date.now() + 24 * 60 * 60 * 1000 };
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    const user = { id: payload.id, username: email, email, name: email.split('@')[0], role };
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ error: 'failed to verify otp' });
  }
});

app.listen(PORT, () => {
  console.log(`OTP server listening on port ${PORT}`);
});
