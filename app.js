document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. Mobile Navigation Menu Toggle
       ========================================================================== */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            mobileToggle.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                mobileToggle.classList.remove('active');
            });
        });
    }

    /* ==========================================================================
       2. Shrinking Header Fallback Scroll Listener
       ========================================================================== */
    const header = document.querySelector('.header');
    
    // Check if scroll-driven animation isn't natively supported in CSS
    if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('header-shrink');
            } else {
                header.classList.remove('header-shrink');
            }
        });
    }

    /* ==========================================================================
       3. Active Navigation Link Syncing
       ========================================================================== */
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);
            
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    });


    /* ==========================================================================
       8. Scroll Animation Trigger using IntersectionObserver
       ========================================================================== */
    function initScrollAnimations(root = document) {
        const animateElements = root.querySelectorAll('.animate-on-scroll:not(.revealed)');

        if ('IntersectionObserver' in window && animateElements.length > 0) {
            const observerOptions = {
                root: null,
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            animateElements.forEach(el => observer.observe(el));
        } else {
            animateElements.forEach(el => el.classList.add('revealed'));
        }
    }

    initScrollAnimations();

    /* ==========================================================================
       9. Portfolio Gallery - loaded from the photo API, shown only once photos exist
       ========================================================================== */
    const portfolioSection = document.getElementById('portfolio');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const navPortfolioLink = document.getElementById('nav-portfolio-link');
    const footerPortfolioLink = document.getElementById('footer-portfolio-link');

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    if (portfolioGrid) {
        fetch('/api/photos')
            .then(res => (res.ok ? res.json() : Promise.reject(new Error('API unavailable'))))
            .then(photos => {
                if (!Array.isArray(photos) || photos.length === 0) return;

                portfolioGrid.innerHTML = photos.map(photo => `
                    <div class="portfolio-item animate-on-scroll">
                        <div class="portfolio-image-box">
                            <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.title)}" loading="lazy">
                        </div>
                        <div class="portfolio-info">
                            <span class="project-cat">${escapeHtml(photo.category)}</span>
                            <h4>${escapeHtml(photo.title)}</h4>
                            <p class="project-loc">${escapeHtml(photo.location)}</p>
                        </div>
                    </div>
                `).join('');

                if (portfolioSection) portfolioSection.hidden = false;
                if (navPortfolioLink) navPortfolioLink.hidden = false;
                if (footerPortfolioLink) footerPortfolioLink.hidden = false;

                initScrollAnimations(portfolioGrid);
            })
            .catch(() => {
                // No backend running (e.g. static file preview) - keep the existing markup as-is.
            });
    }
});
