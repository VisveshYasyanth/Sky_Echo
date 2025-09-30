const API_KEY = "e57a225790e7d4245b6afa07a1f1b517";
let currentWeather = null;
let currentAir = null;

window.onload = () => { getWeather("Madurai"); };

// Scroll to section
function scrollToSection(id){
    const element = document.getElementById(id);
    const headerOffset = document.querySelector("header") ? document.querySelector("header").offsetHeight : 0;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });

    // Update active button
    const map = {
        'forecastSection': 'btnForecast',
        'airSection': 'btnAir',
        'travelSection': 'btnTravel',
        'atmosSection': 'btnAtmos',
        'aboutSection': 'btnAbout'
    };
    setActiveButton(map[id]);
}

// Set active nav button
function setActiveButton(activeId) {
    const buttons = document.querySelectorAll('.nav-tabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    if(activeId) document.getElementById(activeId)?.classList.add('active');
}

// Fetch weather
async function getWeather(city){
    const cityInput = document.getElementById("mainCityInput").value || city;
    if(!cityInput) return alert("Enter city!");

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        if(data.cod!==200){ alert(data.message); return; }
        currentWeather = data;

        document.getElementById("slide1Title").innerText = data.name;
        document.getElementById("slide1Weather").innerHTML = `
            <p>Country: ${data.sys.country}</p>
            <p>Sea Level: ${data.main.sea_level ? data.main.sea_level+' hPa' : 'N/A'}</p>
        `;
        document.getElementById("slide2Weather").innerHTML = `
            <p style="font-size:24px; font-weight:bold;">${new Date().toDateString()}</p>
            <p>🌡️ Temp: ${data.main.temp}°C</p>
            <p>💧 Humidity: ${data.main.humidity}%</p>
            <p>💨 Wind: ${data.wind.speed} m/s</p>
            <p>👁️ Visibility: ${data.visibility} m</p>
            <p>☀️ Sunrise: ${new Date(data.sys.sunrise*1000).toLocaleTimeString()}</p>
            <p>🌇 Sunset: ${new Date(data.sys.sunset*1000).toLocaleTimeString()}</p>
            <p>☁️ Clouds: ${data.clouds.all}%</p>
        `;
        document.getElementById("weather").style.display = "block";

        await getForecast(data.coord.lat, data.coord.lon);
        await getAirQuality(data.coord.lat, data.coord.lon);
        displayAtmospheric();
        updateTravelConditions(data.coord.lat, data.coord.lon);

    } catch(err){ console.error(err); }
}

// Forecast
async function getForecast(lat, lon){
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        const tbody = document.getElementById("forecastContainer");
        tbody.innerHTML = "";
        const daily = data.list.filter(i => i.dt_txt.includes("12:00:00"));

        daily.forEach(item => {
    const date = new Date(item.dt_txt).toLocaleDateString("en-US", {weekday:"short", day:"numeric", month:"short"});
    const iconUrl = `http://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${date}</td>
        <td><img src="${iconUrl}" alt="${item.weather[0].description}" style="vertical-align:middle; width:32px; height:32px;"> ${item.weather[0].description}</td>
        <td>${item.main.temp}°C</td>
        <td>${item.pop ? Math.round(item.pop*100)+'%' : '0%'}</td>
        <td>${Math.round(item.wind.speed)} m/s</td>
    `;
    tr.style.cursor = "pointer";
    tr.onclick = () => showForecastModal(item);
    tbody.appendChild(tr);
        });
    } catch(err) { console.error(err); }
}

// Forecast Modal
function showForecastModal(item){
    const modal = document.getElementById("forecastModal");
    const modalData = document.getElementById("modalData");
    modalData.innerHTML = `
        <p>🌡️ Temp: ${item.main.temp}°C</p>
        <p>💧 Humidity: ${item.main.humidity}%</p>
        <p>💨 Wind: ${item.wind.speed} m/s</p>
        <p>👁️ Visibility: ${currentWeather.visibility} m</p>
        <p>☀️ Sunrise: ${new Date(currentWeather.sys.sunrise*1000).toLocaleTimeString()}</p>
        <p>🌇 Sunset: ${new Date(currentWeather.sys.sunset*1000).toLocaleTimeString()}</p>
        <p>☁️ Clouds: ${item.clouds.all}%</p>
    `;
    modal.style.display = "block";
}
function closeModal(){ document.getElementById("forecastModal").style.display="none"; }
window.onclick = function(event){ if(event.target==document.getElementById("forecastModal")) closeModal(); }

// Air Quality
async function getAirQuality(lat, lon){
    try{
        const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const data = await res.json();
        currentAir = data;
        const aqi = data.list[0].main.aqi;
        const comp = data.list[0].components;
        let aqiText="", aqiColor="";
        if(aqi===1){ aqiText="Good"; aqiColor="good"; }
        else if(aqi===2){ aqiText="Fair"; aqiColor="good"; }
        else if(aqi===3){ aqiText="Moderate"; aqiColor="moderate"; }
        else if(aqi===4){ aqiText="Poor"; aqiColor="poor"; }
        else { aqiText="Very Poor"; aqiColor="poor"; }

        document.getElementById("airContainer").innerHTML = `
            <table class="air-table">
                <thead><tr><th>Index</th><th>Value</th><th>Info</th></tr></thead>
                <tbody>
                    <tr>
                        <td>🌬️ AQI</td>
                        <td>${aqi} (${aqiText}) <div class="scale-bar"><div class="scale-fill ${aqiColor}" style="width:${aqi*20}%"></div></div></td>
                        <td>Air Quality Index (1=Good,5=Very Poor)</td>
                    </tr>
                    <tr>
                        <td>⚪ PM2.5</td>
                        <td>${comp.pm2_5} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.pm2_5<=50?'good':comp.pm2_5<=100?'moderate':'poor'}" style="width:${Math.min(comp.pm2_5,150)}%"></div></div></td>
                        <td>Fine particles <2.5μm harmful to lungs & heart.</td>
                    </tr>
                    <tr>
                        <td>⚫ PM10</td>
                        <td>${comp.pm10} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.pm10<=50?'good':comp.pm10<=100?'moderate':'poor'}" style="width:${Math.min(comp.pm10,150)}%"></div></div></td>
                        <td>Particles <10μm can cause breathing issues.</td>
                    </tr>
                    <tr>
                        <td>🟢 CO</td>
                        <td>${comp.co} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.co<=1000?'good':comp.co<=2000?'moderate':'poor'}" style="width:${Math.min(comp.co/20,100)}%"></div></div></td>
                        <td>Carbon Monoxide can affect heart & lungs at high levels.</td>
                    </tr>
                    <tr>
                        <td>🟠 NO2</td>
                        <td>${comp.no2} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.no2<=50?'good':comp.no2<=100?'moderate':'poor'}" style="width:${Math.min(comp.no2,100)}%"></div></div></td>
                        <td>Nitrogen Dioxide can irritate respiratory system.</td>
                    </tr>
                    <tr>
                        <td>🟣 O3</td>
                        <td>${comp.o3} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.o3<=100?'good':comp.o3<=180?'moderate':'poor'}" style="width:${Math.min(comp.o3/2,100)}%"></div></div></td>
                        <td>Ozone can cause throat & lung irritation.</td>
                    </tr>
                    <tr>
                        <td>🔵 SO2</td>
                        <td>${comp.so2} μg/m³ <div class="scale-bar"><div class="scale-fill ${comp.so2<=20?'good':comp.so2<=80?'moderate':'poor'}" style="width:${Math.min(comp.so2,100)}%"></div></div></td>
                        <td>Sulfur Dioxide can aggravate asthma and eyes.</td>
                    </tr>
                </tbody>
            </table>
        `;
    } catch(err){ console.error(err); }
}

// Travel Conditions
function updateTravelConditions(lat, lon) {
    let airScore = Math.floor(Math.random() * 51) + 50;
    let driveScore = Math.floor(Math.random() * 51) + 50;

    // Air Travel
    const airBox = document.querySelector("#airTravelBox");
    const airFill = airBox.querySelector(".scale-fill");
    airFill.style.width = airScore + "%";
    airFill.className = "scale-fill " + (airScore >= 70 ? "good" : "moderate");
    airBox.childNodes[0].nodeValue = `✈️ Air Travel`;
    airBox.querySelector("small").innerText = airScore >= 70 ? "Good" : "Moderate";

    // Driving
    const driveBox = document.querySelector("#drivingBox");
    const driveFill = driveBox.querySelector(".scale-fill");
    driveFill.style.width = driveScore + "%";
    driveFill.className = "scale-fill " + (driveScore >= 70 ? "good" : "moderate");
    driveBox.childNodes[0].nodeValue = `🚗 Driving`;
    driveBox.querySelector("small").innerText = driveScore >= 70 ? "Good" : "Moderate";
}

// Atmospheric
function displayAtmospheric() {
    if (!currentWeather) return;
    const t = document.getElementById("atmosphericList");
    t.innerHTML = `
        <tr><td>🌡️ Temperature</td><td>${currentWeather.main.temp} °C</td></tr>
        <tr><td>🤗 Feels Like</td><td>${currentWeather.main.feels_like} °C</td></tr>
        <tr><td>💧 Humidity</td><td>${currentWeather.main.humidity} %</td></tr>
        <tr><td>🧭 Pressure</td><td>${currentWeather.main.pressure} hPa</td></tr>
        <tr><td>💨 Wind Speed</td><td>${currentWeather.wind.speed} m/s</td></tr>
        <tr><td>🧭 Wind Direction</td><td>${currentWeather.wind.deg}°</td></tr>
        <tr><td>☁️ Cloudiness</td><td>${currentWeather.clouds.all} %</td></tr>
    `;
}

// Header scroll effect
const header = document.querySelector("header");
window.addEventListener("scroll", () => {
    if (window.innerWidth <= 768) {
        const currentScroll = window.pageYOffset;
        header.style.top = currentScroll <= 0 ? "0" : `-${header.offsetHeight}px`;
    } else header.style.top = "0";
});

// Toggle mobile menu
function toggleMenu() {
    document.getElementById("navMenu").classList.toggle("show");
}


