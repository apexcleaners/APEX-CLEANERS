// =========================================================
// Apex Cleaners — Booking Form Logic
// =========================================================
import { db } from './firebase-config.js';
import {
    collection, addDoc, serverTimestamp,
    query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

emailjs.init("1cJ5XCwIzzmwx2VUl");
console.log("✅ booking.js loaded");

// =========================================================
// DOM Elements
// =========================================================
const bookingForm = document.getElementById('booking-form');
const nameInput = document.getElementById('booking-name');
const emailInput = document.getElementById('booking-email');
const phoneInput = document.getElementById('booking-phone');
const serviceSelect = document.getElementById('booking-service');
const dateInput = document.getElementById('booking-date');
const timeSelect = document.getElementById('booking-time');
const frequencySelect = document.getElementById('booking-frequency');
const propertySizeSelect = document.getElementById('property-size');
const notesTextarea = document.getElementById('special-notes');
const messageDiv = document.getElementById('booking-message');

// =========================================================
// Zimbabwe Phone Validation
// =========================================================
if (phoneInput) {
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '');
        if (phoneInput.value.length > 9) {
            phoneInput.value = phoneInput.value.slice(0, 9);
        }
    });
}

// =========================================================
// Date availability check
// =========================================================
dateInput.addEventListener("change", async () => {
    const selectedDate = dateInput.value;
    if (!selectedDate) return;

    const bookingsQuery = query(
        collection(db, "bookings"),
        where("preferredDate", "==", selectedDate)
    );
    const snapshot = await getDocs(bookingsQuery);
    const remaining = 7 - snapshot.size;

    showMessage(
        remaining <= 0
            ? "❌ This date is fully booked. Please choose another date."
            : `✅ ${remaining} slot${remaining !== 1 ? 's' : ''} remaining for ${selectedDate}`,
        remaining <= 0
    );
    if (remaining <= 0) dateInput.value = "";
});

// =========================================================
// Show message (persistent when booking ID is shown)
// =========================================================
function showMessage(message, isError = false) {
    if (!messageDiv) return;
    messageDiv.innerHTML = message;
    messageDiv.className = `mt-4 p-4 rounded-lg text-center ${
        isError
            ? 'bg-red-900/50 text-red-200 border border-red-700'
            : 'bg-green-900/50 text-green-200 border border-green-700'
    }`;
    // No auto-remove – the user decides when to close (or it’s replaced by a new booking)
}

// =========================================================
// Validation
// =========================================================
function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const service = serviceSelect.value;
    const date = dateInput.value;
    const time = timeSelect.value;
    const frequency = frequencySelect.value;
    const propertySize = propertySizeSelect.value;

    if (!name) { showMessage('Please enter your full name.', true); nameInput.focus(); return false; }
    if (!email) { showMessage('Please enter your email address.', true); emailInput.focus(); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showMessage('Please enter a valid email address.', true); emailInput.focus(); return false; }
    if (!phone) { showMessage('Please enter your phone number.', true); phoneInput.focus(); return false; }
    if (phone.length !== 9) { showMessage('Phone number must contain exactly 9 digits after +263.', true); phoneInput.focus(); return false; }
    if (!service) { showMessage('Please select a service.', true); serviceSelect.focus(); return false; }
    if (!date) { showMessage('Please select a date.', true); dateInput.focus(); return false; }
    const selectedDate = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (selectedDate < today) { showMessage('Please select today or a future date.', true); dateInput.focus(); return false; }
    if (!time) { showMessage('Please select a preferred time.', true); timeSelect.focus(); return false; }
    if (!frequency) { showMessage('Please select cleaning frequency.', true); frequencySelect.focus(); return false; }
    if (!propertySize) { showMessage('Please select property size.', true); propertySizeSelect.focus(); return false; }
    return true;
}

// =========================================================
// Booking Submission
// =========================================================
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
   submitBtn.disabled = true;
submitBtn.innerHTML = `
  <span class="flex items-center justify-center gap-2">
    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Submitting...
  </span>`;

    const fullPhone = `+263${phoneInput.value.trim()}`;

    const bookingData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: fullPhone,
        service: serviceSelect.value,
        preferredDate: dateInput.value,
        preferredTime: timeSelect.value,
        frequency: frequencySelect.value,
        propertySize: propertySizeSelect.value,
        specialInstructions: notesTextarea.value.trim() || '',
        status: 'pending'
    };

    try {
        // Check 7‑per‑day limit
        const selectedDate = bookingData.preferredDate;
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("preferredDate", "==", selectedDate)
        );
        const existingBookings = await getDocs(bookingsQuery);
        if (existingBookings.size >= 7) {
            showMessage(`❌ Sorry, ${selectedDate} is fully booked. Please choose another date.`, true);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        const bookingId = docRef.id;
        console.log('✅ Booking saved:', bookingId);

        // Email to Admin
        try {
            await emailjs.send('service_n3fu595', 'template_yrnqddf', {
                booking_id: bookingId,
                customer_name: bookingData.name,
                customer_email: bookingData.email,
                customer_phone: bookingData.phone,
                service: bookingData.service,
                date: bookingData.preferredDate,
                time: bookingData.preferredTime,
                frequency: bookingData.frequency,
                property_size: bookingData.propertySize,
                notes: bookingData.specialInstructions || "None"
            });
        } catch (emailErr) {
            console.warn('Admin email failed:', emailErr);
        }

        // Email to Customer
        try {
            await emailjs.send('service_n3fu595', 'template_z75qq1c', {
                booking_id: bookingId,
                customer_name: bookingData.name,
                customer_email: bookingData.email,
                service: bookingData.service,
                date: bookingData.preferredDate,
                time: bookingData.preferredTime,
                frequency: bookingData.frequency,
                property_size: bookingData.propertySize
            });
        } catch (emailErr) {
            console.warn('Customer email failed:', emailErr);
        }

        // Persistent success message with Booking ID and copy button
        showMessage(`
            ✅ Booking Submitted Successfully!<br><br>
            <div class="bg-gray-800 inline-block px-4 py-2 rounded-lg text-[#14B8A6] font-mono text-lg">
                Booking ID: <span id="bid-display">${bookingId}</span>
            </div>
            <br>
            <button onclick="navigator.clipboard.writeText('${bookingId}')" class="mt-2 px-4 py-1 bg-[#14B8A6] text-white rounded-lg text-sm">Copy ID</button>
            <br><br>
            Confirmation emails have been sent. Please save this Booking ID for tracking.
        `, false);

        bookingForm.reset();
        // Re‑sync price calculator after reset
        if (typeof window.updateCalculator === 'function') window.updateCalculator();

    } catch (error) {
        console.error('Booking error:', error);
        showMessage(`❌ ${error.message || 'Something went wrong. Please try again.'}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});