const map = L.map('map', { zoomControl: false }).setView([42.000, 21.433], 13);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

const originMarker = L.circleMarker([42.000, 21.433], {
    radius: 15, fillColor: "#ef4444", color: "#b91c1c", weight: 2, opacity: 1, fillOpacity: 0.6
}).addTo(map).bindPopup("<b>Outbreak Origin</b><br>Centar District");

// --- THE AUDIT LOG SYSTEM (FR-02) ---
window.logAction = function(message) {
    const logBox = document.getElementById('audit-log');
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    logBox.innerHTML = `> [${time}] ${message}<br>` + logBox.innerHTML;
};

// --- THE GAME MECHANICS ---
window.interventionBetaReduction = 0;
const cityNodes = [
    { name: "Main Bus Station", lat: 41.990, lng: 21.445, type: "Transit" },
    { name: "Skopje City Mall", lat: 42.004, lng: 21.391, type: "Commercial" },
    { name: "UKIM University", lat: 42.000, lng: 21.443, type: "Education" }
];

const nodeMarkers = [];
cityNodes.forEach(node => {
    let marker = L.circleMarker([node.lat, node.lng], {
        radius: 10, fillColor: "#22c55e", color: "#166534", weight: 2, fillOpacity: 0.8
    }).addTo(map);

    marker.bindTooltip(`${node.name} (Open)`, { permanent: true, direction: "top", className: "text-xs font-bold bg-transparent border-none text-white shadow-none" });

    marker.on('click', function() {
        if (this.options.fillColor === "#22c55e") {
            this.setStyle({ fillColor: "#ef4444", color: "#991b1b" });
            this.setTooltipContent(`${node.name} (LOCKED DOWN)`);
            window.interventionBetaReduction += 0.05;
            window.logAction(`ENACTED: ${node.name} locked down. Beta -0.05`);
        } else {
            this.setStyle({ fillColor: "#22c55e", color: "#166534" });
            this.setTooltipContent(`${node.name} (Open)`);
            window.interventionBetaReduction -= 0.05;
            window.logAction(`LIFTED: ${node.name} reopened. Beta +0.05`);
        }
        if (typeof runSimulation === "function") runSimulation();
    });
    nodeMarkers.push(marker);
});

// --- TOGGLE LAYERS (FR-03) ---
// Fake density circles for Aerodrom and Karposh
const densityLayer = L.layerGroup([
    L.circle([41.985, 21.465], {radius: 1500, color: '#3b82f6', fillOpacity: 0.2, stroke: false}),
    L.circle([42.005, 21.400], {radius: 1200, color: '#3b82f6', fillOpacity: 0.2, stroke: false})
]);

// Fake transit line (East to West boulevard)
const transitLayer = L.polyline([
    [41.980, 21.480], [41.990, 21.445], [42.000, 21.433], [42.005, 21.390]
], {color: '#f59e0b', weight: 4, dashArray: '10, 10'});

document.getElementById('layer-density').addEventListener('change', function() {
    this.checked ? map.addLayer(densityLayer) : map.removeLayer(densityLayer);
    window.logAction(`UI: Toggled Population Density ${this.checked ? 'ON' : 'OFF'}`);
});

document.getElementById('layer-transit').addEventListener('change', function() {
    this.checked ? map.addLayer(transitLayer) : map.removeLayer(transitLayer);
    window.logAction(`UI: Toggled Transit Hubs ${this.checked ? 'ON' : 'OFF'}`);
});

function updateMapSeverity(peakInfected) {
    originMarker.setRadius(Math.min(peakInfected / 5000, 100) + 15);
}