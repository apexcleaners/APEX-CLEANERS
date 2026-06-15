console.log("✅ PRICE CALCULATOR LOADED");

// =========================================================
// Shared price calculation
// =========================================================
const SERVICE_PRICES = { basic: 25, deep: 50, premium: 80 };
const PROPERTY_MULTIPLIERS = { small: 1, medium: 1.5, large: 2, commercial: 3, office: 2.5 };
const FREQUENCY_MULTIPLIERS = { onetime: 1, weekly: 0.85, biweekly: 0.9, twicemonth: 0.92, monthly: 0.95 };

function computePrice(service, property, frequency) {
    if (!service || !property || !frequency) return 0;
    let total = (SERVICE_PRICES[service] || 0) *
                (PROPERTY_MULTIPLIERS[property] || 1) *
                (FREQUENCY_MULTIPLIERS[frequency] || 1);
    return Math.round(total);
}

// =========================================================
// DOM Elements
// =========================================================
const calcService = document.getElementById('calc-service');
const calcProperty = document.getElementById('calc-property');
const calcFrequency = document.getElementById('calc-frequency');
const estimatedPriceEl = document.getElementById('estimated-price');

const bookingService = document.getElementById('booking-service');
const bookingFrequency = document.getElementById('booking-frequency');
const bookingProperty = document.getElementById('property-size');
const bookingPrice = document.getElementById('booking-price');

// =========================================================
// Text‑to‑value mapping for booking form options
// (Already done via explicit value attributes in HTML,
//  so we can just read .value directly.)
// =========================================================

function syncUI() {
    // Decide which set of values to use:
    // If calculator has a selection, use it; otherwise use booking form.
    const service = calcService?.value || bookingService?.value;
    const property = calcProperty?.value || bookingProperty?.value;
    const frequency = calcFrequency?.value || bookingFrequency?.value;

    const price = computePrice(service, property, frequency);

    // Update calculator display
    if (estimatedPriceEl) estimatedPriceEl.textContent = `$${price}`;

    // Update booking form price field
    if (bookingPrice) bookingPrice.value = price ? `$${price}` : '';

    // Sync dropdown selections
    if (calcService && bookingService) {
        // If the change came from booking form, update calculator
        if (document.activeElement === bookingService) {
            calcService.value = bookingService.value;
        } else if (document.activeElement === calcService) {
            bookingService.value = calcService.value;
        }
    }
    if (calcProperty && bookingProperty) {
        if (document.activeElement === bookingProperty) {
            calcProperty.value = bookingProperty.value;
        } else if (document.activeElement === calcProperty) {
            bookingProperty.value = calcProperty.value;
        }
    }
    if (calcFrequency && bookingFrequency) {
        if (document.activeElement === bookingFrequency) {
            calcFrequency.value = bookingFrequency.value;
        } else if (document.activeElement === calcFrequency) {
            bookingFrequency.value = calcFrequency.value;
        }
    }
}

// =========================================================
// Event Listeners
// =========================================================
if (calcService) calcService.addEventListener('change', syncUI);
if (calcProperty) calcProperty.addEventListener('change', syncUI);
if (calcFrequency) calcFrequency.addEventListener('change', syncUI);

if (bookingService) bookingService.addEventListener('change', syncUI);
if (bookingProperty) bookingProperty.addEventListener('change', syncUI);
if (bookingFrequency) bookingFrequency.addEventListener('change', syncUI);

// Initial sync
syncUI();