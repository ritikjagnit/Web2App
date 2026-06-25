const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendInviteEmail(toEmail, ownerEmail, inviteLink) {
    const mailOptions = {
        from: `"stufflas Team" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Invitation to join Team Workspace on stufflas',
        html: `
            <div style="font-family: sans-serif; padding: 25px; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #7c3aed; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">stufflas</h2>
                    <span style="color: #888888; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">web to pwa platform</span>
                </div>
                <h3 style="color: #1a1a1a; margin-top: 0;">Workspace Invitation</h3>
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">Hello,</p>
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">You have been invited by <strong style="color: #7c3aed;">${ownerEmail}</strong> to join their team developer workspace on stufflas.</p>
                <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">To accept this invitation and collaborate on PWA deployment, click the button below to sign up or log in using your email address:</p>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${inviteLink}" style="background-color: #7c3aed; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">Accept Invitation</a>
                </div>
                <p style="color: #888888; font-size: 12px; line-height: 1.6; font-style: italic;">Note: Please make sure to register using the exact email address where you received this invitation.</p>
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                <p style="color: #999999; font-size: 10px; text-align: center; margin-bottom: 0;">&copy; ${new Date().getFullYear()} stufflas Technology. All rights reserved.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
}

module.exports = {
    sendInviteEmail,
};
