const express = require('express');
const path = require('path');
const fs = require('fs');
const { PORT } = require('./config');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

// Serve the admin panel and the public site (this same server hosts everything)
app.use('/admin', express.static(path.join(ROOT_DIR, 'admin')));
app.use(express.static(ROOT_DIR));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
    console.log(`Parshotam website running at http://localhost:${PORT}`);
    console.log(`Admin panel:            http://localhost:${PORT}/admin`);
});
