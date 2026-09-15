const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET } = require('../config');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const validUsername = username === ADMIN_USERNAME;
    const validPassword = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

    if (!validUsername || !validPassword) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, expiresIn: '12h' });
});

module.exports = router;
