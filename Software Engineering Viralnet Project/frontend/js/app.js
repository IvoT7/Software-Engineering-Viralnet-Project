let GLOBAL_DAY = 0;
let isSimulationActive = false;
let runningSpeedMs = 600;
let engineClockInterval;
let MEDICAL_SYSTEM_CEILING = 150000;
let SYSTEM_TREASURY = 15000000000; // 15 BILLION starting budget
let isTerminalScreenTriggered = false;

// 7 Mutators & 10 Directives
let mutatorMatrix = { aerosol: false, fomite: false, zoonotic: false, asymptomatic: false, vaccine: false, cold: false, super: false };
let policyDirectives = { masks: false, hospital: false, borders: false, vaccine: false, quarantine: false, handwash: false, tracing: false, fumigation: false, antiviral: false, quarcenters: false };

const GLOBAL_POPULATION = 4500000;
let currentAgentState = { E: 500, I: 200, R: 0, D: 0 };

// Skopje is properly designated as Vardar Macedonia
let macroRegions = [
    { id: "vardar", name: "Vardar Macedonia (Skopje Hub)", lat: 42.00, lng: 21.43, population: 2070000, S: 2068000, E: 1500, I: 500, R: 0, D: 0, markerRef: null },
    { id: "aegean", name: "Aegean Macedonia", lat: 40.60, lng: 22.90, population: 1395000, S: 1395000, E: 0, I: 0, R: 0, D: 0, markerRef: null },
    { id: "pirin", name: "Pirin Macedonia", lat: 41.70, lng: 23.40, population: 630000, S: 630000, E: 0, I: 0, R: 0, D: 0, markerRef: null },
    { id: "prespa", name: "Mala Prespa / Golo Brdo", lat: 40.90, lng: 20.80, population: 225000, S: 225000, E: 0, I: 0, R: 0, D: 0, markerRef: null },
    { id: "prohor", name: "Prohor Pčinjski", lat: 42.30, lng: 21.90, population: 180000, S: 180000, E: 0, I: 0, R: 0, D: 0, markerRef: null }
];

const NETWORK_CONNECTIONS = { vardar: ["aegean", "pirin", "prespa", "prohor"], aegean: ["vardar", "pirin"], pirin: ["vardar", "aegean"], prespa: ["vardar"], prohor: ["vardar"] };
let trackingHistory = { intervals: [], E: [], I: [], R: [], D: [] };

// Pathogen Database (With Corona Default + 2 New)
const PATHOGEN_DB = {
    covid:   { beta: 0.35, sigma: 0.12, mu: 0.015 },
    spanish: { beta: 0.52, sigma: 0.25, mu: 0.040 },
    ebola:   { beta: 0.18, sigma: 0.10, mu: 0.500 },
    sars:    { beta: 0.28, sigma: 0.16, mu: 0.110 },
    avian:   { beta: 0.22, sigma: 0.18, mu: 0.350 }, // H5N1
    plague:  { beta: 0.40, sigma: 0.20, mu: 0.450 }  // Yersinia Pestis
};

// --- MAP & VISUALS ---
const mapInstance = L.map('map', { zoomControl: false }).setView([41.50, 22.00], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);

// Draw Network Flight/Travel Lines
macroRegions.forEach(node => {
    (NETWORK_CONNECTIONS[node.id] || []).forEach(targetId => {
        let target = macroRegions.find(r => r.id === targetId);
        if (target) L.polyline([[node.lat, node.lng], [target.lat, target.lng]], { color: '#3b82f6', weight: 1.5, dashArray: '5, 10', opacity: 0.4 }).addTo(mapInstance);
    });
});

// Custom Transit SVG Icon
const transitIcon = L.divIcon({ className: 'pulse-transit', html: `<div style="background:#eab308; width:8px; height:8px; border-radius:50%; box-shadow: 0 0 10px #eab308;"></div>`, iconSize: [8,8] });

macroRegions.forEach(node => {
    // Faint Population Density Halo
    L.circle([node.lat, node.lng], { radius: node.population / 40, color: '#3b82f6', weight: 0, fillColor: '#3b82f6', fillOpacity: 0.05 }).addTo(mapInstance);
    
    // Glowing Transit Hubs around the city
    L.marker([node.lat + 0.05, node.lng + 0.05], {icon: transitIcon}).addTo(mapInstance);
    L.marker([node.lat - 0.04, node.lng - 0.02], {icon: transitIcon}).addTo(mapInstance);

    // Active Viral Heat Circle
    node.markerRef = L.circleMarker([node.lat, node.lng], { radius: 10, fillColor: '#22c55e', fillOpacity: 0.8, color: '#000', weight: 2 }).addTo(mapInstance);
    node.markerRef.bindPopup(`<b style="color:black;">${node.name}</b><br>Pop: ${node.population.toLocaleString()}`);
});

function logAction(text) {
    const box = document.getElementById('audit-log');
    if (box) { box.innerHTML += `<br>> [DAY ${GLOBAL_DAY}]: ${text}`; box.scrollTop = box.scrollHeight; }
}

// --- CHART ---
const ctx = document.getElementById('seirChart').getContext('2d');
let timeSeriesChart = new Chart(ctx, {
    type: 'line', data: { labels: trackingHistory.intervals, datasets: [] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
        scales: { y: { display: false, max: 4500000 }, x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } } },
        plugins: { legend: { labels: { color: '#9ca3af' } } }
    }
});

// --- MUTATORS (7 Total) ---
function toggleMutator(key) {
    mutatorMatrix[key] = !mutatorMatrix[key];
    const btn = document.getElementById(`mut-${key}`);
    const badge = document.getElementById(`badge-${key}`);
    
    if (mutatorMatrix[key]) {
        btn.classList.add('border-purple-500', 'bg-purple-900/30', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]');
        badge.innerText = "ACTIVE"; badge.className = "text-xs font-mono bg-purple-500 px-3 py-1 rounded text-white font-bold";
        logAction(`EVOLUTION: Activated [${key}]. Spread difficulty increased.`);
    } else {
        btn.classList.remove('border-purple-500', 'bg-purple-900/30', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]');
        badge.innerText = "OFF"; badge.className = "text-xs font-mono bg-gray-800 px-3 py-1 rounded text-gray-400";
    }
    
    let activeCount = Object.values(mutatorMatrix).filter(v => v).length;
    document.getElementById('active-mutators-count').innerText = `${activeCount} Active`;
}

// --- REGIONAL UI MATRIX ---
function updateRegionalMatrixUI() {
    const container = document.getElementById('regional-matrix');
    container.innerHTML = '';
    
    macroRegions.forEach(node => {
        let textTheme = "text-green-400"; let status = "🟢 SECURE"; let ratio = node.I / node.population;
        if (ratio > 0.001 && ratio <= 0.04) { textTheme = "text-yellow-400"; status = "🟡 SPREAD"; }
        else if (ratio > 0.04 && ratio <= 0.20) { textTheme = "text-orange-500"; status = "🟠 OUTBREAK"; }
        else if (ratio > 0.20) { textTheme = "text-red-500 animate-pulse"; status = "🔴 OVERRUN"; }

        container.innerHTML += `
            <div class="bg-gray-800/50 p-2.5 rounded border border-gray-700 flex justify-between items-center mb-2">
                <div><p class="text-xs font-bold text-gray-200">${node.name}</p><p class="text-[10px] text-gray-400">Cases: ${Math.round(node.I).toLocaleString()}</p></div>
                <span class="text-[9px] font-bold px-2 py-1 rounded bg-black ${textTheme}">${status}</span>
            </div>`;
        
        if (node.markerRef) {
            if (ratio === 0) node.markerRef.setStyle({ fillColor: '#22c55e' });
            else if (ratio <= 0.04) node.markerRef.setStyle({ fillColor: '#eab308' });
            else node.markerRef.setStyle({ fillColor: '#ef4444' });
            node.markerRef.setRadius(10 + (ratio * 40));
        }
    });
}

// --- ENGINE TICK ---
function processSimulationStepTick() {
    if (!isSimulationActive || isTerminalScreenTriggered) return;

    let baseBeta = parseFloat(document.getElementById('beta').value) * parseFloat(document.getElementById('climate-selector').value);
    let baseSigma = parseFloat(document.getElementById('sigma').value);
    let baseMu = parseFloat(document.getElementById('mu').value);
    let baseGamma = 0.06; 

    // Apply Mutators
    if (mutatorMatrix.aerosol) baseBeta += 0.10;
    if (mutatorMatrix.fomite && !policyDirectives.handwash) baseBeta += 0.08; 
    if (mutatorMatrix.zoonotic && !policyDirectives.fumigation) baseBeta += 0.14;
    if (mutatorMatrix.asymptomatic) { baseBeta += 0.05; baseSigma += 0.10; }
    if (mutatorMatrix.vaccine) baseGamma -= 0.05;
    if (mutatorMatrix.cold) baseBeta += 0.05;
    if (mutatorMatrix.super) baseBeta += 0.12;

    // Apply Directives
    if (policyDirectives.masks) baseBeta -= 0.05;
    if (policyDirectives.quarantine) baseBeta -= 0.18;
    if (policyDirectives.vaccine) { baseMu = Math.max(0.001, baseMu * 0.3); baseGamma += 0.07; }
    if (policyDirectives.antiviral) baseGamma += 0.05;
    baseBeta = Math.max(0.01, baseBeta);

    let deltaBuffer = {};
    macroRegions.forEach(node => {
        let newExposed = (baseBeta * node.S * node.I) / node.population;
        if (policyDirectives.tracing && node.E > 10) { let trace = node.E * 0.05; node.E -= trace; node.S += trace; }

        let newInfectious = baseSigma * node.E;
        let newRecovered = baseGamma * node.I;
        let newFatalities = baseMu * node.I;

        if (policyDirectives.quarcenters && node.I > 50) newRecovered += (node.I * 0.04);

        deltaBuffer[node.id] = { dS: -newExposed, dE: newExposed - newInfectious, dI: newInfectious - newRecovered - newFatalities, dR: newRecovered, dD: newFatalities, crossSpill: 0 };
    });

    let travelSpill = 0.002; 
    if (policyDirectives.borders) travelSpill *= 0.20; 

    macroRegions.forEach(node => {
        if (node.I > 50) {
            let travelers = node.I * travelSpill;
            let pathways = NETWORK_CONNECTIONS[node.id] || [];
            pathways.forEach(tId => deltaBuffer[tId].crossSpill += travelers / pathways.length);
            deltaBuffer[node.id].dI -= travelers;
        }
    });

    let totalE = 0, totalI = 0, totalR = 0, totalD = 0;
    macroRegions.forEach(node => {
        let d = deltaBuffer[node.id];
        node.S = Math.max(0, node.S + d.dS); node.E = Math.max(0, node.E + d.dE);
        node.I = Math.max(0, node.I + d.dI + d.crossSpill);
        node.R = Math.max(0, node.R + d.dR); node.D = Math.max(0, node.D + d.dD);
        totalE += node.E; totalI += node.I; totalR += node.R; totalD += node.D;
    });

    GLOBAL_DAY++;

    // Daily Drain applied to the 15 Billion Budget
    if (policyDirectives.quarantine) SYSTEM_TREASURY -= 50000000;
    if (policyDirectives.borders) SYSTEM_TREASURY -= 25000000;
    if (policyDirectives.quarcenters) SYSTEM_TREASURY -= 35000000;

    document.getElementById('day-counter').innerText = `Day ${GLOBAL_DAY}`;
    document.getElementById('hud-exposed').innerText = Math.round(totalE).toLocaleString();
    document.getElementById('hud-infected').innerText = Math.round(totalI).toLocaleString();
    document.getElementById('hud-deaths').innerText = Math.round(totalD).toLocaleString();
    document.getElementById('hud-budget').innerText = `$${Math.max(0, SYSTEM_TREASURY).toLocaleString()}`;

    updateRegionalMatrixUI();

    trackingHistory.intervals.push(`Day ${GLOBAL_DAY}`);
    trackingHistory.E.push(totalE); trackingHistory.I.push(totalI); trackingHistory.R.push(totalR); trackingHistory.D.push(totalD);
    if (trackingHistory.intervals.length > 80) {
        trackingHistory.intervals.shift(); trackingHistory.E.shift(); trackingHistory.I.shift(); trackingHistory.R.shift(); trackingHistory.D.shift();
    }

    const maxCapArray = Array(trackingHistory.intervals.length).fill(MEDICAL_SYSTEM_CEILING);
    timeSeriesChart.data.labels = trackingHistory.intervals;
    timeSeriesChart.data.datasets = [
        { label: 'Exposed', data: trackingHistory.E, borderColor: '#eab308', fill: false, tension: 0.1 },
        { label: 'Infected', data: trackingHistory.I, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', fill: true, tension: 0.1 },
        { label: 'Deaths', data: trackingHistory.D, borderColor: '#ffffff', fill: false, tension: 0.1 },
        { label: 'System Cap', data: maxCapArray, borderColor: '#dc2626', borderDash: [5, 5], borderWidth: 2, pointRadius: 0 }
    ];
    timeSeriesChart.update();

    const alertBox = document.getElementById('hud-infected-card');
    if (totalI > MEDICAL_SYSTEM_CEILING) alertBox.className = "glass-panel p-4 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.6)] border border-red-500 text-center min-w-[130px]";
    else alertBox.className = "glass-panel p-4 rounded-xl shadow-2xl text-center min-w-[130px] transition-all duration-500";

    if (SYSTEM_TREASURY <= 0) executeSimulationTermination("BANKRUPTCY DECLARED", "The $15 Billion treasury is exhausted. The city has fallen into chaos.", "📉");
    else if (totalI >= (GLOBAL_POPULATION * 0.85)) executeSimulationTermination("NETWORK COLLAPSE", "85% of the population is infected. The regional healthcare network has shattered.", "💀");
    else if (GLOBAL_DAY > 20 && totalI < 5 && totalE < 5) executeSimulationTermination("VIRUS ERADICATED", "Brilliant work. The pathogen was purged without bankrupting the state.", "🌍");
}

function executeSimulationTermination(title, summary, icon) {
    isTerminalScreenTriggered = true; setSimulationSpeed('pause');
    document.getElementById('endgame-title').innerText = title;
    document.getElementById('endgame-msg').innerText = summary; document.getElementById('endgame-icon').innerText = icon;
    document.getElementById('modal-endgame').classList.replace('hidden', 'flex');
}

// --- DIRECTIVES (Capped at 100M Cost) ---
function registerDirectiveButton(id, cost, flag, callback) {
    document.getElementById(id).addEventListener('click', function() {
        if (SYSTEM_TREASURY >= cost && !policyDirectives[flag]) {
            SYSTEM_TREASURY -= cost; policyDirectives[flag] = true;
            this.classList.add('border-emerald-500', 'bg-emerald-900/30', 'shadow-[0_0_20px_rgba(16,185,129,0.3)]');
            logAction(`DIRECTIVE PASSED: $${(cost/1000000)}M allocated for [${flag}].`);
            if (callback) callback();
            document.getElementById('hud-budget').innerText = `$${SYSTEM_TREASURY.toLocaleString()}`;
            closeModals();
        } else if (!policyDirectives[flag]) alert("Insufficient Treasury Funds!");
    });
}

registerDirectiveButton('btn-masks', 15000000, 'masks');
registerDirectiveButton('btn-hospital', 85000000, 'hospital', () => MEDICAL_SYSTEM_CEILING += 120000);
registerDirectiveButton('btn-borders', 95000000, 'borders');
registerDirectiveButton('btn-vaccine', 100000000, 'vaccine');
registerDirectiveButton('btn-quarantine', 80000000, 'quarantine');
registerDirectiveButton('btn-handwash', 20000000, 'handwash');
registerDirectiveButton('btn-tracing', 50000000, 'tracing');
registerDirectiveButton('btn-fumigation', 30000000, 'fumigation');
registerDirectiveButton('btn-antiviral', 60000000, 'antiviral');
registerDirectiveButton('btn-quarcenters', 70000000, 'quarcenters');

function setSimulationSpeed(mode) {
    clearInterval(engineClockInterval);
    ['btn-pause', 'btn-play', 'btn-fast'].forEach(id => document.getElementById(id).className = "px-4 py-1.5 text-xs font-bold rounded hover:bg-gray-800 text-gray-400 transition");
    if (mode === 'pause') { isSimulationActive = false; document.getElementById('btn-pause').className = "px-4 py-1.5 text-xs font-bold rounded bg-gray-700 text-yellow-400 shadow"; }
    else {
        isSimulationActive = true; runningSpeedMs = (mode === 'fast') ? 80 : 600;
        const color = mode === 'fast' ? 'text-blue-400' : 'text-green-400';
        document.getElementById(mode === 'fast' ? 'btn-fast' : 'btn-play').className = `px-4 py-1.5 text-xs font-bold rounded bg-gray-700 ${color} shadow`;
        engineClockInterval = setInterval(processSimulationStepTick, runningSpeedMs);
    }
}

document.getElementById('btn-pause').addEventListener('click', () => setSimulationSpeed('pause'));
document.getElementById('btn-play').addEventListener('click', () => setSimulationSpeed('normal'));
document.getElementById('btn-fast').addEventListener('click', () => setSimulationSpeed('fast'));

document.getElementById('virus-selector').addEventListener('change', function() {
    const p = PATHOGEN_DB[this.value];
    document.getElementById('beta').value = p.beta; document.getElementById('sigma').value = p.sigma; document.getElementById('mu').value = p.mu;
    ['beta', 'sigma', 'mu'].forEach(k => document.getElementById(`${k}-val`).innerText = parseFloat(document.getElementById(k).value).toFixed(3));
});

['beta', 'sigma', 'mu'].forEach(k => document.getElementById(k).addEventListener('input', () => document.getElementById(`${k}-val`).innerText = parseFloat(document.getElementById(k).value).toFixed(3)));

function resetSimulation() {
    clearInterval(engineClockInterval); GLOBAL_DAY = 0; SYSTEM_TREASURY = 15000000000; MEDICAL_SYSTEM_CEILING = 150000; isTerminalScreenTriggered = false;
    trackingHistory = { intervals: [], E: [], I: [], R: [], D: [] };
    
    macroRegions[0] = { id: "vardar", name: "Vardar Macedonia (Skopje Hub)", lat: 42.00, lng: 21.43, population: 2070000, S: 2068000, E: 1500, I: 500, R: 0, D: 0, markerRef: macroRegions[0].markerRef };
    macroRegions[1] = { id: "aegean", name: "Aegean Macedonia", lat: 40.60, lng: 22.90, population: 1395000, S: 1395000, E: 0, I: 0, R: 0, D: 0, markerRef: macroRegions[1].markerRef };
    macroRegions[2] = { id: "pirin", name: "Pirin Macedonia", lat: 41.70, lng: 23.40, population: 630000, S: 630000, E: 0, I: 0, R: 0, D: 0, markerRef: macroRegions[2].markerRef };
    macroRegions[3] = { id: "prespa", name: "Mala Prespa / Golo Brdo", lat: 40.90, lng: 20.80, population: 225000, S: 225000, E: 0, I: 0, R: 0, D: 0, markerRef: macroRegions[3].markerRef };
    macroRegions[4] = { id: "prohor", name: "Prohor Pčinjski", lat: 42.30, lng: 21.90, population: 180000, S: 180000, E: 0, I: 0, R: 0, D: 0, markerRef: macroRegions[4].markerRef };

    Object.keys(policyDirectives).forEach(k => policyDirectives[k] = false);
    document.querySelectorAll('[id^="btn-"]').forEach(btn => { if(btn.id !== 'btn-pause' && btn.id !== 'btn-play' && btn.id !== 'btn-fast') btn.className = "text-left glass-panel hover:bg-gray-800 p-5 rounded-xl transition flex flex-col group"; });
    
    document.getElementById('modal-endgame').classList.replace('flex', 'hidden');
    document.getElementById('audit-log').innerHTML = "[SYSTEM REBOOT]: Variables Flushed.";
    updateRegionalMatrixUI(); setSimulationSpeed('pause');
}

updateRegionalMatrixUI(); setSimulationSpeed('pause');