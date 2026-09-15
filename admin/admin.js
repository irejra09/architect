(() => {
    const TOKEN_KEY = 'parshotam_admin_token';

    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const photoForm = document.getElementById('photo-form');
    const formTitle = document.getElementById('form-title');
    const formError = document.getElementById('form-error');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formCancelBtn = document.getElementById('form-cancel-btn');
    const imageRequiredHint = document.getElementById('image-required-hint');

    const photoIdInput = document.getElementById('photo-id');
    const photoTitleInput = document.getElementById('photo-title');
    const photoCategoryInput = document.getElementById('photo-category');
    const photoLocationInput = document.getElementById('photo-location');
    const photoImageInput = document.getElementById('photo-image');

    const photoList = document.getElementById('photo-list');
    const emptyState = document.getElementById('empty-state');

    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
    const clearToken = () => localStorage.removeItem(TOKEN_KEY);

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    function showDashboard() {
        loginScreen.hidden = true;
        dashboardScreen.hidden = false;
        loadPhotos();
    }

    function showLogin() {
        dashboardScreen.hidden = true;
        loginScreen.hidden = false;
    }

    async function apiFetch(url, options = {}) {
        const token = getToken();
        const headers = options.headers || {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            clearToken();
            showLogin();
            throw new Error('Session expired. Please log in again.');
        }
        return res;
    }

    // ---- Login ----
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.hidden = true;

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                loginError.textContent = data.error || 'Login failed.';
                loginError.hidden = false;
                return;
            }

            setToken(data.token);
            loginForm.reset();
            showDashboard();
        } catch (err) {
            loginError.textContent = 'Could not reach the server.';
            loginError.hidden = false;
        }
    });

    logoutBtn.addEventListener('click', () => {
        clearToken();
        showLogin();
    });

    // ---- Photo list ----
    async function loadPhotos() {
        try {
            const res = await apiFetch('/api/photos');
            const photos = await res.json();
            renderPhotos(photos);
        } catch (err) {
            // apiFetch already redirected to login on auth failure
        }
    }

    function renderPhotos(photos) {
        photoList.innerHTML = '';
        emptyState.hidden = photos.length > 0;

        photos.forEach((photo) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.title)}">
                <div class="photo-card-body">
                    <span class="photo-card-cat">${escapeHtml(photo.category)}</span>
                    <span class="photo-card-title">${escapeHtml(photo.title)}</span>
                    <span class="photo-card-loc">${escapeHtml(photo.location)}</span>
                </div>
                <div class="photo-card-actions">
                    <button type="button" class="btn-secondary edit-btn">Edit</button>
                    <button type="button" class="btn-secondary delete-btn">Delete</button>
                </div>
            `;
            card.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(photo));
            card.querySelector('.delete-btn').addEventListener('click', () => deletePhoto(photo.id));
            photoList.appendChild(card);
        });
    }

    // ---- Create / Edit form ----
    function enterEditMode(photo) {
        photoIdInput.value = photo.id;
        photoTitleInput.value = photo.title;
        photoCategoryInput.value = photo.category;
        photoLocationInput.value = photo.location;
        photoImageInput.value = '';

        formTitle.textContent = 'Edit Photo';
        formSubmitBtn.textContent = 'Save Changes';
        formCancelBtn.hidden = false;
        imageRequiredHint.textContent = '(leave empty to keep current photo)';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        photoForm.reset();
        photoIdInput.value = '';
        formTitle.textContent = 'Add New Photo';
        formSubmitBtn.textContent = 'Add Photo';
        formCancelBtn.hidden = true;
        imageRequiredHint.textContent = '(required)';
        formError.hidden = true;
    }

    formCancelBtn.addEventListener('click', resetForm);

    photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formError.hidden = true;

        const id = photoIdInput.value;
        const formData = new FormData();
        formData.append('title', photoTitleInput.value.trim());
        formData.append('category', photoCategoryInput.value.trim());
        formData.append('location', photoLocationInput.value.trim());
        if (photoImageInput.files[0]) {
            formData.append('image', photoImageInput.files[0]);
        }

        if (!id && !photoImageInput.files[0]) {
            formError.textContent = 'Please choose an image for the new photo.';
            formError.hidden = false;
            return;
        }

        try {
            const res = await apiFetch(id ? `/api/photos/${id}` : '/api/photos', {
                method: id ? 'PUT' : 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                formError.textContent = data.error || 'Something went wrong.';
                formError.hidden = false;
                return;
            }

            resetForm();
            loadPhotos();
        } catch (err) {
            // apiFetch already redirected to login on auth failure
        }
    });

    async function deletePhoto(id) {
        if (!confirm('Delete this photo? This cannot be undone.')) return;
        try {
            await apiFetch(`/api/photos/${id}`, { method: 'DELETE' });
            loadPhotos();
        } catch (err) {
            // apiFetch already redirected to login on auth failure
        }
    }

    // ---- Init ----
    if (getToken()) {
        showDashboard();
    } else {
        showLogin();
    }
})();
