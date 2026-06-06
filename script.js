// --- UI Bindings ---
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const errorMsg = document.getElementById('error-message');
const loadingText = document.getElementById('loading');

const locationNameEl = document.getElementById('location-name');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('weather-desc');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');

// --- 1. Event Listeners ---
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch();
});

// --- 2. Main Search Execution Pipeline ---
async function handleSearch() {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    // Reset components to state defaults
    showError(false);
    weatherCard.classList.add('hidden');
    loadingText.classList.remove('hidden');

    try {
        // Step A: Convert the raw city name text string into GPS coordinates via Geocoding
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City details not found. Please verify the spelling.');
        }

        // Extracted variables
        const { latitude, longitude, name, country } = geoData.results[0];

        // Step B: Use coordinates to pull direct metrics from the weather grid
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Step C: Push variables directly to display system elements
        renderWeather(name, country, weatherData.current);

    } catch (err) {
        showError(true, err.message || 'An operational communications breakdown occurred.');
    } finally {
        loadingText.classList.add('hidden');
    }
}

// --- 3. DOM Card Population Logic ---
function renderWeather(city, country, currentMetrics) {
    locationNameEl.textContent = `${city}, ${country}`;
    tempEl.textContent = `${Math.round(currentMetrics.temperature_2m)}°C`;
    humidityEl.textContent = `${currentMetrics.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${currentMetrics.wind_speed_10m} km/h`;
    
    // Map WMO numerical codes to user-friendly English interpretations
    descEl.textContent = interpretWeatherCode(currentMetrics.weather_code);

    // Unhide final rendered layout element
    weatherCard.classList.remove('hidden');
}

// --- 4. Alert Panel Switcher Utility ---
function showError(shouldDisplay, messageText = '') {
    if (shouldDisplay) {
        errorMsg.textContent = messageText;
        errorMsg.classList.remove('hidden');
    } else {
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
    }
}

// --- 5. WMO Standard Weather Code Interpreter Mapping ---
// Reference specifications governed via Open-Meteo operational guidelines
function interpretWeatherCode(code) {
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
    if (code === 45 || code === 48) return 'Foggy atmospheric conditions';
    if (code === 51 || code === 53 || code === 55) return 'Light drizzling precipitation';
    if (code === 61 || code === 63 || code === 65) return 'Rainfall';
    if (code === 71 || code === 73 || code === 75) return 'Snow fall activity';
    if (code === 80 || code === 81 || code === 82) return 'Rain showers';
    if (code === 95 || code === 96 || code === 99) return 'Thunderstorm configurations';
    return 'Localized climate variability';
}