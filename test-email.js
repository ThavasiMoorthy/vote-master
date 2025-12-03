import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Try loading from root first, then server/
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

async function testEmail() {
    console.log('--- Testing Email Configuration ---');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('ERROR: Missing SMTP environment variables in .env file.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('Connection verified successfully!');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL, // Send to self
            subject: 'Test Email from Vote Master',
            text: 'If you see this, your SMTP configuration is correct!'
        });
        console.log('Test email sent:', info.messageId);
    } catch (error) {
        console.error('FAILED:', error);
    }
}

testEmail();
