// =========================================================
// Apex Cleaners — Admin Moderation Panel Logic
// =========================================================
// Requires Firebase Authentication (Email/Password) to be
// enabled, and an admin user created in the Firebase console
// (Authentication -> Users -> Add user).
//
// Only authenticated users can read unapproved reviews,
// approve reviews, or delete reviews — enforced both here
// and in firestore.rules.
// =========================================================

import { db, auth } from './firebase-config.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ---------------------------------------------------------
   DOM references
   --------------------------------------------------------- */
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminEmailEl = document.getElementById('admin-email');

const reviewsTableBody = document.getElementById('reviews-table-body');
const loadingSpinner = document.getElementById('admin-loading');
const emptyState = document.getElementById('admin-empty');

const statTotal = document.getElementById('stat-total');
const statApproved = document.getElementById('stat-approved');
const statPending = document.getElementById('stat-pending');

let unsubscribeReviews = null;

/* ---------------------------------------------------------
   Auth: login / logout / state
   --------------------------------------------------------- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  loginError.classList.add('hidden');

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Login failed:', err);
    loginError.textContent = 'Invalid email or password.';
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    adminEmailEl.textContent = user.email;
    listenToReviews();
  } else {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    if (unsubscribeReviews) unsubscribeReviews();
  }
});

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return '—';
  return timestamp.toDate().toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function renderStarsText(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/* ---------------------------------------------------------
   Real-time listener: ALL reviews, newest first
   --------------------------------------------------------- */
function listenToReviews() {
  loadingSpinner.classList.remove('hidden');

  const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));

  unsubscribeReviews = onSnapshot(q, (snapshot) => {
    loadingSpinner.classList.add('hidden');

    const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    statTotal.textContent = reviews.length;
    statApproved.textContent = reviews.filter((r) => r.approved).length;
    statPending.textContent = reviews.filter((r) => !r.approved).length;

    reviewsTableBody.innerHTML = '';

    if (reviews.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    reviews.forEach((review) => reviewsTableBody.appendChild(buildRow(review)));
  }, (err) => {
    console.error('Error loading reviews:', err);
    loadingSpinner.classList.add('hidden');
  });
}

/* ---------------------------------------------------------
   Build a table row for one review
   --------------------------------------------------------- */
function buildRow(review) {
  const row = document.createElement('tr');
  row.className = 'border-b border-primary/10 align-top';

  // Name + date
  const nameCell = document.createElement('td');
  nameCell.className = 'py-3 pr-4';
  const nameEl = document.createElement('p');
  nameEl.className = 'font-display font-semibold text-primary';
  nameEl.textContent = review.name;
  const dateEl = document.createElement('p');
  dateEl.className = 'text-xs text-muted mt-0.5';
  dateEl.textContent = formatDate(review.createdAt);
  nameCell.append(nameEl, dateEl);

  // Rating
  const ratingCell = document.createElement('td');
  ratingCell.className = 'py-3 pr-4 text-gold font-semibold whitespace-nowrap';
  ratingCell.textContent = renderStarsText(review.rating);

  // Review text
  const reviewCell = document.createElement('td');
  reviewCell.className = 'py-3 pr-4 text-sm text-ink/80 max-w-sm';
  reviewCell.textContent = review.review;

  // Status
  const statusCell = document.createElement('td');
  statusCell.className = 'py-3 pr-4';
  const badge = document.createElement('span');
  badge.className = review.approved
    ? 'inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/20 text-primary'
    : 'inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-gold/20 text-gold';
  badge.textContent = review.approved ? 'Approved' : 'Pending';
  statusCell.appendChild(badge);

  // Actions
  const actionsCell = document.createElement('td');
  actionsCell.className = 'py-3 whitespace-nowrap';

  if (!review.approved) {
    const approveBtn = document.createElement('button');
    approveBtn.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primaryLight transition mr-2';
    approveBtn.textContent = 'Approve';
    approveBtn.addEventListener('click', () => approveReview(review.id));
    actionsCell.appendChild(approveBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteReview(review.id));
  actionsCell.appendChild(deleteBtn);

  row.append(nameCell, ratingCell, reviewCell, statusCell, actionsCell);
  return row;
}

/* ---------------------------------------------------------
   Actions: approve / delete
   --------------------------------------------------------- */
async function approveReview(id) {
  try {
    await updateDoc(doc(db, 'reviews', id), { approved: true });
  } catch (err) {
    console.error('Error approving review:', err);
    alert('Could not approve review. Please try again.');
  }
}

async function deleteReview(id) {
  if (!confirm('Delete this review permanently? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(db, 'reviews', id));
  } catch (err) {
    console.error('Error deleting review:', err);
    alert('Could not delete review. Please try again.');
  }
}