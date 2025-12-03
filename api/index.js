const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
let sgMail = null;
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Vercel rewrite handler: strip /api prefix if present
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '');
    }
    next();
});

const PORT = process.env.PORT || 3001;
const OTP_TTL = 5 * 60 * 1000; // 5 minutes
const SECRET = process.env.OTP_SECRET || 'default-dev-secret-do-not-use-in-prod';

// Helper to sign OTP details
function signOtp(email, otp, expires) {
    const data = `${email}.${otp}.${expires}`;
    return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

let smtpTransporter = null;

console.log('--- OTP Server Configuration Check ---');
console.log('SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
console.log('--------------------------------------');

if (process.env.SENDGRID_API_KEY) {
    try {
        sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('SendGrid configured.');
    } catch (e) {
        console.error('Failed to load @sendgrid/mail:', e.message);
        sgMail = null;
    }
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('SMTP configured.');
} else {
    console.log('No email provider configured. OTPs will be logged to console.');
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + OTP_TTL;
        const hash = signOtp(email, otp, expires);

        if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
            console.log('Attempting to send via SendGrid...');
            const msg = {
                to: email,
                from: process.env.FROM_EMAIL,
                subject: 'Your admin OTP',
                text: `Your one-time code: ${otp} (valid for 5 minutes)`
            };
            await sgMail.send(msg);
            console.log('SendGrid email sent successfully.');
            return res.json({ success: true, hash, expires });
        }

        if (smtpTransporter && process.env.FROM_EMAIL) {
            console.log('Attempting to send via SMTP...');
            await smtpTransporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: email,
                subject: 'Your admin OTP',
                text: `Your one-time code: ${otp} (valid for 5 minutes)`
            });
            console.log('SMTP email sent successfully.');
            return res.json({ success: true, hash, expires });
        }

        // Dev fallback
        console.log(`Dev OTP for ${email}: ${otp}`);
        return res.json({ success: true, otp, hash, expires });
    } catch (err) {
        console.error('send-otp error:', err);
        return res.status(500).json({ error: 'failed to send otp', details: err.message });
    }
});

app.post('/verify-otp', (req, res) => {
    try {
        const { email, otp, hash, expires } = req.body;
        if (!email || !otp || !hash || !expires) {
            return res.status(400).json({ error: 'missing required fields' });
        }

        if (Date.now() > expires) {
            return res.status(400).json({ error: 'otp expired' });
        }

        const expectedHash = signOtp(email, otp, expires);
        if (hash !== expectedHash) {
            return res.status(400).json({ error: 'invalid otp' });
        }

        // Create a base64 token payload
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

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`OTP server listening on port ${PORT}`);
    });
}
