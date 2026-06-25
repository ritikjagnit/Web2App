const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.elasticemail.com',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// POST /api/support/email
router.post('/email', async (req, res) => {
    const { email, subject, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }

    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to the admin
            replyTo: email,
            subject: `AppOrbit Support Request: ${subject || 'General Inquiry'}`,
            text: `New support request from: ${email}\n\nMessage:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: 'Support email sent successfully' });
    } catch (err) {
        console.error('Support Email Error:', err);
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

module.exports = router;
