console.log("🔍 reviews.js loaded – starting...");

import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reviewsContainer = document.getElementById('reviews-container');
const averageRatingEl = document.getElementById('average-rating');
const totalReviewsEl = document.getElementById('total-reviews');

console.log("DOM elements:", { reviewsContainer, averageRatingEl, totalReviewsEl });

async function loadReviews() {
    try {
        const q = query(
            collection(db, 'reviews'),
            where('approved', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        console.log(`✅ Found ${snapshot.size} approved reviews`);

        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<div class="review-card text-center p-8 text-gray-400">✨ No approved reviews yet.</div>';
            totalReviewsEl.textContent = '0';
            averageRatingEl.textContent = '0.0';
            return;
        }

        let totalRating = 0;
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            totalRating += data.rating || 0;
            const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
            const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Recent';
            html += `
                <div class="review-card">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-white">${escapeHtml(data.name)}</span>
                        <span class="star-rating" style="color:#fbbf24">${stars}</span>
                    </div>
                    <p class="text-gray-300 text-sm mb-3">"${escapeHtml(data.review)}"</p>
                    <span class="text-gray-500 text-xs">${escapeHtml(date)}</span>
                </div>
            `;
        });
        reviewsContainer.innerHTML = html;
        const avg = (totalRating / snapshot.size).toFixed(1);
        totalReviewsEl.textContent = snapshot.size;
        averageRatingEl.textContent = avg;
    } catch (err) {
        console.error("Firestore error:", err);
        reviewsContainer.innerHTML = `<div class="review-card text-center p-8 text-red-400">❌ Error: ${err.message}</div>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

loadReviews();