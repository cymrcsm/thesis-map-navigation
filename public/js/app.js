// SLSU Main Campus Coordinates (Sogod)
const SLSU_COORDS = [10.39069930895956, 124.98074286229156];
const map = L.map('map', { zoomControl: false }).setView(SLSU_COORDS, 18);

// Tile Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors | SLSU Kiosk'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let markersGroup = L.layerGroup().addTo(map);
let selectedBuilding = null;
let currentCategory = 'All';

// Fixed "YOU ARE HERE" Pin
L.marker(SLSU_COORDS, {
  icon: L.divIcon({
    className: 'kiosk-pin',
    html: '<div style="background:#ef4444; color:white; padding:6px 10px; border-radius:20px; font-weight:bold; font-size:12px; white-space:nowrap;">📍 YOU ARE HERE</div>'
  })
}).addTo(map);

// Fetch Buildings
async function loadBuildings(category = 'All') {
  try {
    const res = await fetch(`/api/buildings?category=${category}`);
    const result = await res.json();
    
    markersGroup.clearLayers();

    result.data.forEach(building => {
      const marker = L.marker([building.latitude, building.longitude]).addTo(markersGroup);
      marker.bindPopup(`<b>${building.name}</b><br>Category: ${building.category}`);
      marker.on('click', () => selectBuilding(building));
    });
  } catch (err) {
    console.error('Failed to load buildings:', err);
  }
}

// Select Building & Floor Handler
async function selectBuilding(building) {
  selectedBuilding = building;
  map.flyTo([building.latitude, building.longitude], 19, { duration: 1 });

  const floorContainer = document.getElementById('floorButtons');
  const floorControls = document.getElementById('floor-controls');
  floorContainer.innerHTML = '';
  floorControls.style.display = 'flex';

  for (let f = 1; f <= building.total_floors; f++) {
    const btn = document.createElement('button');
    btn.className = `floor-btn ${f === 1 ? 'active' : ''}`;
    btn.innerText = `Floor ${f}`;
    btn.onclick = () => {
      document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadFloorRooms(building.id, f);
    };
    floorContainer.appendChild(btn);
  }

  loadFloorRooms(building.id, 1);
}

// Fetch Offices
async function loadFloorRooms(buildingId, floorLevel) {
  try {
    const res = await fetch(`/api/buildings/${buildingId}/floors/${floorLevel}/rooms`);
    const data = await res.json();

    let roomListHtml = data.rooms.map(r => `
      <li style="margin-bottom:8px;">
        <strong>${r.office_name}</strong> (Room ${r.room_number})<br>
        <small style="color:#94a3b8;">Head: ${r.department_head || 'N/A'}</small><br>
        <small style="color:#38bdf8;">Hours: ${r.operating_hours}</small>
      </li>
    `).join('');

    document.getElementById('detailsCard').innerHTML = `
      <h2 style="margin-top:0; color:#38bdf8; font-size:18px;">${selectedBuilding.name}</h2>
      <p style="font-size:13px; color:#94a3b8;">${selectedBuilding.description}</p>
      <hr style="border-color:#334155;">
      <h3 style="font-size:15px;">Floor ${floorLevel} Directory (${data.count} offices):</h3>
      <ul style="padding-left:18px;">${roomListHtml.length ? roomListHtml : '<li>No listed offices on this floor.</li>'}</ul>
    `;
  } catch (err) {
    console.error('Failed to load rooms:', err);
  }
}

function filterCategory(category, element) {
  currentCategory = category;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
  loadBuildings(category);
}

async function handleSearch(query) {
  if (!query || query.trim() === '') {
    loadBuildings(currentCategory);
    return;
  }

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.results.length > 0) {
      let searchHtml = data.results.map(r => `
        <div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #334155; cursor:pointer;" onclick="map.flyTo([${r.latitude}, ${r.longitude}], 19)">
          <strong style="color:#38bdf8;">${r.office_name}</strong> (Room ${r.room_number})<br>
          <small style="color:#94a3b8;">Building: ${r.building_name} - Floor ${r.floor_level}</small>
        </div>
      `).join('');

      document.getElementById('detailsCard').innerHTML = `
        <h2 style="margin-top:0; color:#38bdf8; font-size:18px;">Search Results (${data.match_count})</h2>
        ${searchHtml}
      `;
    } else {
      document.getElementById('detailsCard').innerHTML = `
        <h2 style="margin-top:0; color:#38bdf8; font-size:18px;">No Results Found</h2>
        <p>No matching offices found for "${query}".</p>
      `;
    }
  } catch (err) {
    console.error('Search error:', err);
  }
}

window.onload = () => loadBuildings('All');