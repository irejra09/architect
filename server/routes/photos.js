const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_TYPES.has(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
        }
        cb(null, true);
    },
});

function removeUploadedFile(filename) {
    if (!filename) return;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.unlink(filePath, () => {});
}

function handleUploadErrors(err, req, res, next) {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message });
    }
    next();
}

// GET /api/photos - public, list all portfolio photos
router.get('/', (req, res) => {
    res.json(db.listPhotos());
});

// GET /api/photos/:id - public, single photo
router.get('/:id', (req, res) => {
    const photo = db.getPhoto(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo not found.' });
    res.json(photo);
});

// POST /api/photos - admin only, create with image upload
router.post('/', requireAdmin, upload.single('image'), handleUploadErrors, (req, res) => {
    const { title, category, location } = req.body || {};

    if (!title || !category || !location) {
        if (req.file) removeUploadedFile(req.file.filename);
        return res.status(400).json({ error: 'title, category, and location are required.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'An image file is required.' });
    }

    const photo = db.createPhoto({
        title,
        category,
        location,
        image: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(photo);
});

// PUT /api/photos/:id - admin only, update fields and/or replace image
router.put('/:id', requireAdmin, upload.single('image'), handleUploadErrors, (req, res) => {
    const existing = db.getPhoto(req.params.id);
    if (!existing) {
        if (req.file) removeUploadedFile(req.file.filename);
        return res.status(404).json({ error: 'Photo not found.' });
    }

    const { title, category, location } = req.body || {};
    const updates = {};
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (location) updates.location = location;

    if (req.file) {
        updates.image = `/uploads/${req.file.filename}`;
    }

    const updated = db.updatePhoto(req.params.id, updates);

    if (req.file && existing.image) {
        removeUploadedFile(path.basename(existing.image));
    }

    res.json(updated);
});

// DELETE /api/photos/:id - admin only
router.delete('/:id', requireAdmin, (req, res) => {
    const removed = db.deletePhoto(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Photo not found.' });
    if (removed.image) removeUploadedFile(path.basename(removed.image));
    res.json({ success: true });
});

module.exports = router;
