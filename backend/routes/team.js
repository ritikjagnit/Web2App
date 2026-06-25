const express = require('express');
const router = express.Router();
const { sendInviteEmail } = require('../services/emailService');

// POST /api/team/invite
router.post('/invite', async (req, res) => {
    const { email, ownerEmail, inviteLink } = req.body;

    if (!email || !ownerEmail || !inviteLink) {
        return res.status(400).json({ error: 'Missing required parameters: email, ownerEmail, or inviteLink' });
    }

    try {
        await sendInviteEmail(email, ownerEmail, inviteLink);
        res.json({ success: true, message: 'Invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending invite email:', err);
        res.status(500).json({ error: 'Failed to send invitation email', details: err.message });
    }
});

module.exports = router;
