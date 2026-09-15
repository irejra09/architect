require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_to_a_long_random_string';
const PORT = process.env.PORT || 3000;

if (JWT_SECRET === 'please_change_this_to_a_long_random_string') {
    console.warn('[config] Using the default JWT_SECRET. Set a real secret in server/.env before deploying.');
}
if (ADMIN_PASSWORD === 'changeme123') {
    console.warn('[config] Using the default admin password. Set ADMIN_PASSWORD in server/.env before deploying.');
}

module.exports = {
    PORT,
    ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    JWT_SECRET,
};
