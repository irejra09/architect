const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data', 'photos.json');

function readAll() {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    return raw ? JSON.parse(raw) : [];
}

function writeAll(photos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

function listPhotos() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getPhoto(id) {
    return readAll().find((p) => p.id === id) || null;
}

function createPhoto({ title, category, location, image }) {
    const photos = readAll();
    const photo = {
        id: crypto.randomUUID(),
        title,
        category,
        location,
        image,
        createdAt: new Date().toISOString(),
    };
    photos.push(photo);
    writeAll(photos);
    return photo;
}

function updatePhoto(id, updates) {
    const photos = readAll();
    const index = photos.findIndex((p) => p.id === id);
    if (index === -1) return null;
    photos[index] = { ...photos[index], ...updates, id: photos[index].id };
    writeAll(photos);
    return photos[index];
}

function deletePhoto(id) {
    const photos = readAll();
    const index = photos.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const [removed] = photos.splice(index, 1);
    writeAll(photos);
    return removed;
}

module.exports = { listPhotos, getPhoto, createPhoto, updatePhoto, deletePhoto };
