// ==========================================
// 1. CATEGORY & LOCATION DATA REGISTRY
// ==========================================

const CATEGORIES = [
  { id: "ALL", name: "All Categories" },
  { id: "Executive", name: "Executive & Administrative Offices", color: "#4b8df2" },
  { id: "Archives", name: "Archives & Records", color: "#ab6a30" },
  { id: "Auxiliary", name: "Auxiliary & Institutional Services", color: "#0891b2" }
];

// Note: Coordinates are written as [X, Y] exactly as shown in the inspector log
const LOCATIONS = [
  {
    id: "office-president",
    name: "Office of the President",
    acronym: "OP",
    building: "Administration Building",
    category: "Executive",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [5457, 2205], // [X, Y]
    description: "The primary executive office for university governance and administrative leadership."
  },
  {
    id: "student-records-archive",
    name: "Student Records Archive",
    acronym: "SRA",
    building: "Administration Building",
    category: "Archives",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [5465, 2031], // [X, Y]
    description: "Central repository for student academic transcripts, permanent records, and enrollment archives."
  },
  {
    id: "ovpaa-ovpaf",
    name: "Office of the Vice President for Academic Affairs & Office of the Vice President for Administration and Finance",
    acronym: "OVPAA / OVPAF",
    building: "Administration Building",
    category: "Executive",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4873, 2172], // [X, Y]
    description: "Executive offices coordinating university curriculum, academic policies, operational administration, and fiscal management."
  },
  {
    id: "human-resource",
    name: "Human Resource Management",
    acronym: "HRMO",
    building: "Administration Building",
    category: "Executive",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4609, 2216], // [X, Y]
    description: "Oversees personnel management, employee relations, recruitment, and faculty benefits."
  },
  {
    id: "bargo",
    name: "Business, Auxiliary and Resource Generation Office",
    acronym: "BARGO",
    building: "Administration Building",
    category: "Auxiliary",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4771, 2720], // [X, Y]
    description: "Handles university auxiliary ventures, institutional income generation, and business facility rentals."
  },
  {
    id: "archives-center",
    name: "Archives Center",
    acronym: "ARCHIVES",
    building: "Administration Building",
    category: "Archives",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4586, 1745], // [X, Y]
    description: "Institutional repository preserving historical records, university publications, and institutional artifacts."
  },
  {
    id: "coa",
    name: "Commission on Audit",
    acronym: "COA",
    building: "Administration Building",
    category: "Executive",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4706, 1559], // [X, Y]
    description: "Government auditing office reviewing university financial accounts, fiscal accountability, and compliance."
  },
  {
    id: "quality-assurance",
    name: "Office of the Director for Quality Assurance",
    acronym: "ODQA",
    building: "Administration Building",
    category: "Executive",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [4878, 1573], // [X, Y]
    description: "Leads institutional accreditation, quality management systems, and academic standard compliance."
  },
  {
    id: "gad-center",
    name: "Gender and Development Center (GAD)",
    acronym: "GAD",
    building: "Student Services Building",
    category: "Auxiliary",
    floor: "Ground Floor",
    hours: "8:00 AM - 5:00 PM (Mon - Fri)",
    coords: [5109, 1572], // [X, Y]
    description: "Promotes gender-responsive programs, advocacy initiatives, and campus-wide inclusivity support."
  }
];

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

// Converts standard [X, Y] data format to Leaflet's internal [Y, X] (Lat, Lng) format
function toLeafletCoords(xyCoords) {
  return [xyCoords[1], xyCoords[0]];
}

function getCategoryColor(categoryName) {
  const cat = CATEGORIES.find(c => c.id === categoryName);
  return cat ? cat.color : '#4b8df2';
}

// ==========================================
// 3. LEAFLET MAP INITIALIZATION
// ==========================================

const MAP_WIDTH = 7852;
const MAP_HEIGHT = 12060;
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -4,
  maxZoom: 1,
  zoomSnap: 0.25,
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  attributionControl: false
});

L.imageOverlay('assets/groundFloor_layer.png', bounds).addTo(map);

function autoCenterCampus(animate = true) {
  map.fitBounds(bounds, { animate: animate });
  map.panBy([-180, 0], { animate: animate });
}
autoCenterCampus(false);

setTimeout(() => map.invalidateSize(), 200);

// ==========================================
// 4. UI ELEMENT REFERENCES
// ==========================================

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const categoryDropdown = document.getElementById('category-dropdown');

const tutorialView = document.getElementById('tutorial-view');
const detailView = document.getElementById('detail-view');
const backToTutorialBtn = document.getElementById('back-to-tutorial-btn');
const recenterRoomBtn = document.getElementById('recenter-room-btn');

const detailBadge = document.getElementById('detail-badge');
const detailTitle = document.getElementById('detail-title');
const detailBuilding = document.getElementById('detail-building');
const detailFloor = document.getElementById('detail-floor');
const detailHours = document.getElementById('detail-hours');
const detailDesc = document.getElementById('detail-desc');

let activeSelectedLocation = null;
const markerLayer = L.layerGroup().addTo(map);

// ==========================================
// 5. POPULATE DROPDOWN
// ==========================================

categoryDropdown.innerHTML = '';
CATEGORIES.forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat.id;
  opt.textContent = cat.name;
  categoryDropdown.appendChild(opt);
});

// ==========================================
// 6. SVG MARKER CREATION & RENDERING
// ==========================================

const locationMarkerIcon = L.icon({
  iconUrl: 'assets/location.svg',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

function renderMarkers(selectedCategory = "ALL", searchQuery = "") {
  markerLayer.clearLayers();
  const q = searchQuery.toLowerCase().trim();

  const filtered = LOCATIONS.filter(loc => {
    const matchesCat = selectedCategory === "ALL" || loc.category === selectedCategory;
    const matchesSearch = !q || 
      loc.name.toLowerCase().includes(q) || 
      loc.acronym.toLowerCase().includes(q) || 
      loc.building.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  filtered.forEach(loc => {
    // Converts [X, Y] -> [Y, X] for Leaflet marker placement
    const leafletPosition = toLeafletCoords(loc.coords);
    const marker = L.marker(leafletPosition, { icon: locationMarkerIcon });

    marker.on('click', () => showLocationDetails(loc));
    markerLayer.addLayer(marker);
  });
}

function showLocationDetails(loc) {
  activeSelectedLocation = loc;
  const pinColor = getCategoryColor(loc.category);

  detailBadge.textContent = loc.category;
  detailBadge.style.background = `${pinColor}1A`;
  detailBadge.style.color = pinColor;

  detailTitle.textContent = loc.name;
  detailBuilding.textContent = `${loc.building} (${loc.acronym})`;
  detailFloor.textContent = loc.floor;
  detailHours.textContent = loc.hours;
  detailDesc.textContent = loc.description;

  tutorialView.classList.add('hidden');
  detailView.classList.remove('hidden');

  // Converts [X, Y] -> [Y, X] for Leaflet flyTo
  const leafletPosition = toLeafletCoords(loc.coords);
  map.flyTo(leafletPosition, -0.5, { animate: true, duration: 0.8 });
}

function showTutorialView() {
  activeSelectedLocation = null;
  detailView.classList.add('hidden');
  tutorialView.classList.remove('hidden');
}

// ==========================================
// 7. EVENT LISTENERS
// ==========================================

backToTutorialBtn.addEventListener('click', showTutorialView);

recenterRoomBtn.addEventListener('click', () => {
  if (activeSelectedLocation) {
    const leafletPosition = toLeafletCoords(activeSelectedLocation.coords);
    map.flyTo(leafletPosition, 0, { animate: true });
  }
});

searchInput.addEventListener('input', (e) => {
  renderMarkers(categoryDropdown.value, e.target.value);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  renderMarkers(categoryDropdown.value, '');
});

categoryDropdown.addEventListener('change', (e) => {
  renderMarkers(e.target.value, searchInput.value);
});

// Map controls
document.getElementById('zoom-in').addEventListener('click', () => map.zoomIn());
document.getElementById('zoom-out').addEventListener('click', () => map.zoomOut());
document.getElementById('recenter-map-btn').addEventListener('click', () => {
  autoCenterCampus(true);
  showTutorialView();
});

// Floor buttons
document.querySelectorAll('.floor-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Coordinate Inspector: Outputs exact [X, Y] to match LOCATIONS array format
const inspector = document.getElementById('coord-inspector');
map.on('click', (e) => {
  const y = Math.round(e.latlng.lat);
  const x = Math.round(e.latlng.lng);
  inspector.innerText = `coords: [${x}, ${y}]`;
});

// Initial Marker Render
renderMarkers();