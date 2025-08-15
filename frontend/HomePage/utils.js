// Sample data
const mangaData = [
            {
                id: 1,
                title: "One Piece",
                status: "Ongoing",
                description: "Follow Monkey D. Luffy's quest to become the Pirate King.",
                chapters: 1000
            },
            {
                id: 2,
                title: "Naruto",
                status: "Completed",
                description: "The story of a young ninja's journey to become Hokage.",
                chapters: 700
            },
            {
                id: 3,
                title: "Attack on Titan",
                status: "Completed",
                description: "Humanity's fight against the Titans.",
                chapters: 139
            },
            {
                id: 4,
                title: "My Hero Academia",
                status: "Ongoing",
                description: "In a world of superpowers, a boy dreams of becoming a hero.",
                chapters: 350
            },
            {
                id: 5,
                title: "Dragon Ball",
                status: "Completed",
                description: "Goku's adventures in search of the Dragon Balls.",
                chapters: 519
            },
            {
                id: 6,
                title: "Demon Slayer",
                status: "Completed",
                description: "A boy's quest to save his sister from demons.",
                chapters: 205
            }
        ];        

        let currentManga = null;
        let currentChapterIndex = 0;

        // Initialize the website
        function init() {
            populateMangaGrid();
        }

        // Show different pages
        function showPage(pageId) {
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        }

        // Populate manga grid
        function populateMangaGrid() {
            const grid = document.getElementById('mangaGrid');
            grid.innerHTML = '';
            
            mangaData.forEach(manga => {
                const card = document.createElement('div');
                card.className = 'manga-card';
                card.onclick = () => showMangaDetail(manga);
                
                card.innerHTML = `
                    <div class="manga-cover">${manga.title}</div>
                    <div class="manga-info">
                        <div class="manga-title">${manga.title}</div>
                        <div class="manga-status">${manga.status} • ${manga.chapters} chapters</div>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }

        // Show manga details
        function showMangaDetail(manga) {
            currentManga = manga;
            document.getElementById('detailTitle').textContent = manga.title;
            document.getElementById('detailCover').textContent = manga.title;
            document.getElementById('detailDescription').textContent = manga.description;
            
            // Populate chapters list
            const chaptersList = document.getElementById('chaptersList');
            chaptersList.innerHTML = '';
            
            for (let i = 1; i <= Math.min(manga.chapters, 20); i++) {
                const chapterItem = document.createElement('div');
                chapterItem.className = 'chapter-item';
                chapterItem.onclick = () => startReading(i - 1);
                chapterItem.innerHTML = `
                    <span>Chapter ${i}</span>
                    <span>2 days ago</span>
                `;
                chaptersList.appendChild(chapterItem);
            }
            
            showPage('detail');
        }

        // Start reading
        function startReading(chapterIndex) {
            currentChapterIndex = chapterIndex;
            document.getElementById('currentChapter').textContent = `${currentManga.title} - Chapter ${chapterIndex + 1}`;
            
            // Generate sample pages
            const pagesContainer = document.getElementById('mangaPages');
            pagesContainer.innerHTML = '';
            
            for (let i = 1; i <= 10; i++) {
                const page = document.createElement('div');
                page.className = 'manga-page';
                page.textContent = `Page ${i} - ${currentManga.title} Chapter ${chapterIndex + 1}`;
                page.style.minHeight = '600px';
                pagesContainer.appendChild(page);
            }
            
            // Update navigation buttons
            document.getElementById('prevBtn').disabled = chapterIndex === 0;
            document.getElementById('nextBtn').disabled = chapterIndex >= Math.min(currentManga.chapters, 20) - 1;
            
            showPage('reading');
        }

        // Chapter navigation
        function previousChapter() {
            if (currentChapterIndex > 0) {
                startReading(currentChapterIndex - 1);
            }
        }

        function nextChapter() {
            if (currentChapterIndex < Math.min(currentManga.chapters, 20) - 1) {
                startReading(currentChapterIndex + 1);
            }
        }

        // Handle login
        function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const username = email.split('@')[0];
            
            // Store user info (in a real app, this would be handled properly)
            document.getElementById('loginLink').style.display = 'none';
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('username').textContent = username;
            
            showPage('home');
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const grid = document.getElementById('mangaGrid');
            
            if (searchTerm === '') {
                populateMangaGrid();
                return;
            }
            
            const filteredManga = mangaData.filter(manga => 
                manga.title.toLowerCase().includes(searchTerm)
            );
            
            grid.innerHTML = '';
            filteredManga.forEach(manga => {
                const card = document.createElement('div');
                card.className = 'manga-card';
                card.onclick = () => showMangaDetail(manga);
                
                card.innerHTML = `
                    <div class="manga-cover">${manga.title}</div>
                    <div class="manga-info">
                        <div class="manga-title">${manga.title}</div>
                        <div class="manga-status">${manga.status} • ${manga.chapters} chapters</div>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        });

                /* ===== AUTH (header) ===== */
        function escapeHtml(s = '') {
        return s.replace(/[&<>"']/g, m => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[m]));
        }

        async function fetchMe() {
        try {
            const r = await fetch('/auth/me', { credentials: 'include' });
            const me = await r.json();           // null nếu chưa login
            renderAuth(me);
        } catch {
            renderAuth(null);
        }
        }

        function renderAuth(me) {
        const box = document.getElementById('authArea');
        if (!box) return;

        if (!me) {
            // CHƯA login: giữ dropdown Login mặc định
            box.innerHTML = `
            <div class="user-dropdown">
                <a href="#" class="login-toggle" onclick="showPage('login'); return false;">Login</a>
                <div class="dropdown-menu">
                <a href="#" onclick="showPage('login'); return false;">Log in</a>
                <a href="#" onclick="showPage('categories'); return false;">Categories</a>
                </div>
            </div>`;
            return;
        }

        // ĐÃ login: đổi thành avatar + tên, dropdown có Categories & Logout
        const name = escapeHtml(me.name || (me.email ? me.email.split('@')[0] : 'User'));
        const avatar = me.avatar
            ? `<img class="user-avatar" src="${escapeHtml(me.avatar)}" alt="avatar">`
            : `<span class="user-avatar"></span>`;

        box.innerHTML = `
            <div class="user-dropdown">
            <button class="user-toggle" onclick="return false;">
                ${avatar}<span class="user-name" title="${name}">${name}</span>
            </button>
            <div class="dropdown-menu">
                <a href="#" onclick="showPage('categories'); return false;">Categories</a>
                <a href="#" onclick="logout(); return false;">Logout</a>
            </div>
            </div>`;
        }

        async function logout() {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        renderAuth(null);
        showPage('home');
        }


        window.onload = () => { init(); fetchMe(); };
