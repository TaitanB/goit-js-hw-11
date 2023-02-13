import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import axios from 'axios';
import scrollBy from './scrollBy.js';

// ======================================

const API_KEY = '33528220-6f12bec756615243821cbd5de';
const BASE_URL = 'https://pixabay.com/api';
let page = 1;
let per_page = 40;
let searchQuery = '';
let totalHits = 0;
let lightbox = '';

async function searchImage() {
  const response = await axios.get(
    `${BASE_URL}/?key=${API_KEY}&q=${searchQuery}&image_type=photo&per_page=${per_page}&page=${page}&orientation=horizontal&safesearch=true`
  );
  totalHits = response.data.totalHits;
  nextPage();
  return response.data.hits;
}

// =========================================

const searchForm = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');

searchForm.addEventListener('submit', onSearch);

// =========================================================

const loading = document.querySelector('.loading');

window.addEventListener('scroll', infiniteScroll);

function infiniteScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  console.log({ scrollTop, scrollHeight, clientHeight });

  if (clientHeight + scrollTop >= scrollHeight) {
    showLoading();
  } else if (scrollHeight - scrollTop === clientHeight) {
    galleryEndInfo();
  }
}

function showLoading() {
  loading.classList.add('show');
  setTimeout(fetchImages, 500);
}

function showRemove() {
  loading.classList.remove('show');
}

// =======================================================

async function onSearch(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const value = form.elements.searchQuery.value.trim();
  searchQuery = value;

  resetPage();
  clearGallery();
  await fetchImages().finally(() => form.reset());
}

async function fetchImages() {
  try {
    const images = await searchImage();
    const markup = await images.reduce(
      (markup, image) => createMarkup(image) + markup,
      ''
    );

    appendImagesToGallery(markup);
    lightbox.refresh();

    if (totalHits > per_page && page - 1 !== 1) {
      scrollBy();
    }

    if (totalHits === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      showRemove();
    } else if (totalHits > 0 && page - 1 === 1) {
      totalImages(totalHits);
      galleryEndInfo();
      showRemove();
    } else {
      galleryEndInfo();
      showRemove();
    }
  } catch (err) {
    return console.error(err);
  }
}

function appendImagesToGallery(markup) {
  gallery.insertAdjacentHTML('beforeend', markup);
  lightBox();
}

function clearGallery() {
  gallery.innerHTML = '';
}

// ========================================================

function createMarkup({
  largeImageURL,
  webformatURL,
  tags,
  likes,
  views,
  comments,
  downloads,
}) {
  return `
  <a href="${largeImageURL}">
  <div class="photo-card">
  <img src="${webformatURL}" alt="${tags}" loading="lazy" />
  <div class="info">
    <p class="info-item">
      <b>Likes: </b>${likes}
    </p>
    <p class="info-item">
      <b>Views: </b>${views}
    </p>
    <p class="info-item">
      <b>Comments: </b>${comments}
    </p>
    <p class="info-item">
      <b>Downloads: </b>${downloads}
    </p>
  </div>
</div></a>
  `;
}

// ========================================================

function nextPage() {
  page += 1;
}

function resetPage() {
  page = 1;
}

function lightBox() {
  lightbox = new SimpleLightbox('.gallery a', {
    captionsData: 'alt',
    captionDelay: 250,
  });
}

function totalImages(totalHits) {
  Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
}

function galleryEndInfo() {
  if (totalHits / per_page < page - 1) {
    showRemove();
    Notiflix.Notify.success(
      "We're sorry, but you've reached the end of search results."
    );
  }
}
