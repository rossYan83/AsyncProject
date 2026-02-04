// Конфігурація API
const API_KEY = '54018086-4743ed0a7fd1bc6bcbbf9c225'; // Замініть на ваш ключ
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 12;


let currentQuery = '';
let currentPage = 1;
let totalHits = 0;


const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.getElementById('load-more');
const loader = document.querySelector('.loader');


initApp();

function initApp() {
    searchForm.addEventListener('submit', handleSearch);
    loadMoreBtn.addEventListener('click', handleLoadMore);
}


async function handleSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query').trim();
    
    if (!query) {
        showNotification('Будь ласка, введіть пошуковий запит', 'error');
        return;
    }
    
    currentQuery = query;
    currentPage = 1;
    gallery.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    
    await fetchImages();
}

async function handleLoadMore() {
    currentPage += 1;
    await fetchImages();
}

async function fetchImages() {
    try {
        showLoader();
        
        const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(currentQuery)}&image_type=photo&orientation=horizontal&page=${currentPage}&per_page=${PER_PAGE}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideLoader();
        
        if (data.hits.length === 0 && currentPage === 1) {
            showNotification('Нічого не знайдено. Спробуйте інший запит.', 'info');
            return;
        }
        
        totalHits = data.totalHits;
        
        renderGallery(data.hits);
        
        if (currentPage * PER_PAGE < totalHits) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
            if (data.hits.length > 0) {
                showNotification('Ви переглянули всі зображення.', 'info');
            }
        }
        
        if (currentPage > 1) {
            smoothScroll();
        }
        
        if (currentPage === 1 && data.hits.length > 0) {
            showNotification(`Знайдено ${totalHits} зображень`, 'success');
        }
        
    } catch (error) {
        hideLoader();
        console.error('Помилка при завантаженні зображень:', error);
        showNotification('Помилка при завантаженні зображень. Спробуйте пізніше.', 'error');
    }
}

function renderGallery(images) {
    const markup = images.map(image => createImageCard(image)).join('');
    gallery.insertAdjacentHTML('beforeend', markup);
    
    attachModalHandlers();
}

function createImageCard(image) {
    return `
        <li>
            <div class="photo-card" data-large="${image.largeImageURL}">
                <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
                
                <div class="stats">
                    <p class="stats-item">
                        <i class="material-icons">thumb_up</i>
                        ${formatNumber(image.likes)}
                    </p>
                    <p class="stats-item">
                        <i class="material-icons">visibility</i>
                        ${formatNumber(image.views)}
                    </p>
                    <p class="stats-item">
                        <i class="material-icons">comment</i>
                        ${formatNumber(image.comments)}
                    </p>
                    <p class="stats-item">
                        <i class="material-icons">cloud_download</i>
                        ${formatNumber(image.downloads)}
                    </p>
                </div>
            </div>
        </li>
    `;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function smoothScroll() {
    const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();
    
    window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
    });
}

function showLoader() {
    loader.style.display = 'flex';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function attachModalHandlers() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        newCard.addEventListener('click', openModal);
    });
}

function openModal(e) {
    const largeImageURL = e.currentTarget.dataset.large;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="modal-content">
            <img src="${largeImageURL}" alt="Large image" />
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => closeModal(modal));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

