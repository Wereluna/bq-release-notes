document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allNotes = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let sortOrder = 'desc'; // 'desc' = newest first, 'asc' = oldest first
    let selectedNote = null;

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const notesContainer = document.getElementById('notes-container');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const btnRetry = document.getElementById('btn-retry');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statIssues = document.getElementById('stat-issues');
    const statChanges = document.getElementById('stat-changes');

    // Controls Elements
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const filterChips = document.querySelectorAll('#filter-chips .chip');
    const btnSort = document.getElementById('btn-sort');

    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const modalClose = document.getElementById('modal-close');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalTweet = document.getElementById('btn-modal-tweet');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const modalRefType = document.getElementById('modal-ref-type');
    const modalRefDate = document.getElementById('modal-ref-date');
    const modalRefText = document.getElementById('modal-ref-text');

    // --- API Interactions ---
    async function fetchNotes(forceRefresh = false) {
        setLoading(true);
        try {
            const url = forceRefresh ? '/api/notes?refresh=true' : '/api/notes';
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status}`);
            }
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            allNotes = data.notes || [];
            updateStats(allNotes);
            applyFiltersAndRender();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // --- State Handlers ---
    function setLoading(isLoading) {
        if (isLoading) {
            loadingState.style.display = 'flex';
            notesContainer.style.display = 'none';
            errorState.style.display = 'none';
            emptyState.style.display = 'none';
            btnRefresh.classList.add('refreshing');
            btnRefresh.disabled = true;
        } else {
            loadingState.style.display = 'none';
            btnRefresh.classList.remove('refreshing');
            btnRefresh.disabled = false;
        }
    }

    function showError(message) {
        notesContainer.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'flex';
        errorMessage.textContent = message || 'An unexpected error occurred while loading release notes.';
    }

    // --- Stats Updater ---
    function updateStats(notes) {
        statTotal.textContent = notes.length;
        
        const features = notes.filter(n => n.type.toLowerCase() === 'feature').length;
        const changes = notes.filter(n => n.type.toLowerCase() === 'changed' || n.type.toLowerCase() === 'change').length;
        const issues = notes.filter(n => {
            const type = n.type.toLowerCase();
            return type === 'issue' || type === 'fix' || type === 'deprecation' || type === 'deprecated';
        }).length;

        // Animate counter numbers
        animateCounter(statTotal, notes.length);
        animateCounter(statFeatures, features);
        animateCounter(statChanges, changes);
        animateCounter(statIssues, issues);
    }

    function animateCounter(element, target) {
        let count = 0;
        const duration = 800; // ms
        const stepTime = Math.max(Math.floor(duration / (target || 1)), 15);
        
        element.textContent = 0;
        if (target === 0) return;
        
        const timer = setInterval(() => {
            count += Math.ceil(target / 30);
            if (count >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = count;
            }
        }, stepTime);
    }

    // --- Filtering, Sorting & Rendering ---
    function applyFiltersAndRender() {
        let filtered = [...allNotes];

        // 1. Search Query Filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(note => 
                note.text.toLowerCase().includes(query) || 
                note.type.toLowerCase().includes(query) ||
                note.date.toLowerCase().includes(query)
            );
        }

        // 2. Category Chip Filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(note => {
                const type = note.type.toLowerCase();
                if (currentFilter === 'feature') return type === 'feature';
                if (currentFilter === 'changed') return type === 'changed' || type === 'change';
                if (currentFilter === 'issue') return type === 'issue';
                if (currentFilter === 'fix') return type === 'fix';
                if (currentFilter === 'other') {
                    return type !== 'feature' && type !== 'changed' && type !== 'change' && type !== 'issue' && type !== 'fix';
                }
                return true;
            });
        }

        // 3. Sort Order
        filtered.sort((a, b) => {
            const dateA = new Date(a.updated_raw || a.date);
            const dateB = new Date(b.updated_raw || b.date);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        // 4. Render
        renderNotes(filtered);
    }

    function renderNotes(notes) {
        notesContainer.innerHTML = '';
        
        if (notes.length === 0) {
            emptyState.style.display = 'flex';
            notesContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        notesContainer.style.display = 'flex';

        notes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card card';
            
            // Badge color type
            const typeLower = note.type.toLowerCase();
            let badgeClass = 'badge-other';
            if (typeLower === 'feature') badgeClass = 'badge-feature';
            else if (typeLower === 'changed' || typeLower === 'change') badgeClass = 'badge-changed';
            else if (typeLower === 'issue') badgeClass = 'badge-issue';
            else if (typeLower === 'fix') badgeClass = 'badge-fix';

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-meta">
                        <span class="badge ${badgeClass}">${note.type}</span>
                        <time class="note-date" datetime="${note.updated_raw}">${note.date}</time>
                    </div>
                    <div class="note-actions-top">
                        <button class="action-icon-btn share-tweet" title="Share on X">
                            <i class="fa-brands fa-x-twitter"></i>
                        </button>
                    </div>
                </div>
                <div class="note-body">
                    ${note.html}
                </div>
                <div class="note-footer">
                    ${note.link ? `
                        <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="doc-link">
                            <span>Official Docs</span>
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    ` : '<span></span>'}
                    <button class="tweet-btn-inline">
                        <i class="fa-brands fa-x-twitter"></i>
                        <span>Tweet Update</span>
                    </button>
                </div>
            `;

            // Add Event Listeners for Twitter Sharing
            const tweetButtons = card.querySelectorAll('.share-tweet, .tweet-btn-inline');
            tweetButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openTweetModal(note);
                });
            });

            notesContainer.appendChild(card);
        });
    }

    // --- Tweet Modal Logic ---
    function generateTweetDraft(note) {
        const header = `BigQuery ${note.type} (${note.date}):\n`;
        const hashtags = `\n#GCP #BigQuery`;
        const docLink = note.link ? `\nDoc: ${note.link}` : '';
        
        // Twitter treats links as exactly 23 characters
        const linkLengthInTwitter = note.link ? 23 : 0;
        const staticTextLen = header.length + hashtags.length + (note.link ? 6 : 0) + linkLengthInTwitter; // "Doc: " + link + tag
        
        const maxLen = 280;
        const availableTextLen = maxLen - staticTextLen - 6; // buffer for spacing and quotes
        
        let textDraft = note.text;
        if (textDraft.length > availableTextLen) {
            textDraft = textDraft.substring(0, availableTextLen - 3) + '...';
        }
        
        return `${header}"${textDraft}"${docLink}${hashtags}`;
    }

    function openTweetModal(note) {
        selectedNote = note;
        
        // Populate modal reference preview
        modalRefType.textContent = note.type;
        // set badge class
        modalRefType.className = 'ref-badge';
        const typeLower = note.type.toLowerCase();
        if (typeLower === 'feature') modalRefType.classList.add('badge-feature');
        else if (typeLower === 'changed' || typeLower === 'change') modalRefType.classList.add('badge-changed');
        else if (typeLower === 'issue') modalRefType.classList.add('badge-issue');
        else if (typeLower === 'fix') modalRefType.classList.add('badge-fix');
        else modalRefType.classList.add('badge-other');

        modalRefDate.textContent = note.date;
        modalRefText.textContent = note.text;
        
        // Populate composer
        const draft = generateTweetDraft(note);
        tweetTextarea.value = draft;
        updateCharCount();
        
        // Display Modal
        tweetModal.style.display = 'flex';
        setTimeout(() => tweetModal.classList.add('active'), 10);
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
        setTimeout(() => {
            tweetModal.style.display = 'none';
            selectedNote = null;
        }, 300);
    }

    function updateCharCount() {
        const text = tweetTextarea.value;
        
        // Twitter specific link length counting
        let computedLength = text.length;
        
        // Find URLs in text and count them as 23 characters
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (matches) {
            matches.forEach(url => {
                computedLength = computedLength - url.length + 23;
            });
        }
        
        charCount.textContent = computedLength;
        
        if (computedLength > 280) {
            charCount.classList.add('warning');
            btnModalTweet.disabled = true;
        } else {
            charCount.classList.remove('warning');
            btnModalTweet.disabled = false;
        }
    }

    function executeTweet() {
        if (!selectedNote) return;
        const tweetText = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
    }

    // --- Event Listeners ---
    
    // Refresh Button
    btnRefresh.addEventListener('click', () => fetchNotes(true));
    btnRetry.addEventListener('click', () => fetchNotes(true));

    // Search Bar Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim() !== '') {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
        }
        applyFiltersAndRender();
    });

    // Clear Search Button
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        applyFiltersAndRender();
        searchInput.focus();
    });

    // Category Chip Filters
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            applyFiltersAndRender();
        });
    });

    // Sort Button
    btnSort.addEventListener('click', () => {
        if (sortOrder === 'desc') {
            sortOrder = 'asc';
            btnSort.innerHTML = `
                <span>Oldest First</span>
                <i class="fa-solid fa-arrow-up-short-wide"></i>
            `;
        } else {
            sortOrder = 'desc';
            btnSort.innerHTML = `
                <span>Newest First</span>
                <i class="fa-solid fa-arrow-down-short-wide"></i>
            `;
        }
        applyFiltersAndRender();
    });

    // Reset Filters in Empty State
    btnResetFilters.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        
        filterChips.forEach(c => c.classList.remove('active'));
        document.querySelector('#filter-chips .chip[data-filter="all"]').classList.add('active');
        currentFilter = 'all';
        
        sortOrder = 'desc';
        btnSort.innerHTML = `
            <span>Newest First</span>
            <i class="fa-solid fa-arrow-down-short-wide"></i>
        `;
        
        applyFiltersAndRender();
    });

    // Modal Close Triggers
    modalClose.addEventListener('click', closeTweetModal);
    btnModalCancel.addEventListener('click', closeTweetModal);
    btnModalTweet.addEventListener('click', executeTweet);
    tweetTextarea.addEventListener('input', updateCharCount);

    // Close Modal on clicking outside the modal card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Close Modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.style.display === 'flex') {
            closeTweetModal();
        }
    });

    // --- Initialize Application ---
    fetchNotes(false);
});
