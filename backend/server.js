const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admobRoutes = require('./routes/admob');
const pwaRoutes = require('./routes/pwa');
const profilesRoutes = require('./routes/profiles');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static builds
app.use('/builds', express.static(path.join(__dirname, 'builds')));

// Routes
app.use('/api/admob', admobRoutes);
app.use('/api/pwa', pwaRoutes);
app.use('/api/app', pwaRoutes); // Compatibility fallback
app.use('/api/profiles', profilesRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
