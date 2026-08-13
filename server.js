const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db', 'slsu_directory.db');

// Database Connection
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✔ Connected to SLSU Directory SQLite database.');
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API ENDPOINT 1: Get All Buildings
app.get('/api/buildings', (req, res) => {
  const { category } = req.query;
  let sql = `SELECT * FROM buildings`;
  let params = [];

  if (category && category !== 'All') {
    sql += ` WHERE category = ?`;
    params.push(category);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: rows ? rows.length : 0, data: rows || [] });
  });
});

// API ENDPOINT 2: Get Specific Building Details + Floor List
app.get('/api/buildings/:id', (req, res) => {
  const { id } = req.params;
  const sqlBuilding = `SELECT * FROM buildings WHERE id = ?`;
  const sqlFloors = `SELECT floor_level, floor_plan_image FROM floors WHERE building_id = ? ORDER BY floor_level ASC`;

  db.get(sqlBuilding, [id], (err, building) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!building) return res.status(404).json({ error: 'Building not found' });

    db.all(sqlFloors, [id], (err, floors) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...building, floors });
    });
  });
});

// API ENDPOINT 3: Get Offices/Rooms on a Specific Floor
app.get('/api/buildings/:id/floors/:floor/rooms', (req, res) => {
  const { id, floor } = req.params;
  const sql = `SELECT * FROM rooms WHERE building_id = ? AND floor_level = ? ORDER BY room_number ASC`;

  db.all(sql, [id, floor], (err, rooms) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ building_id: parseInt(id), floor_level: parseInt(floor), count: rooms ? rooms.length : 0, rooms: rooms || [] });
  });
});

// API ENDPOINT 4: Search Across Offices, Departments, and Buildings
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const searchTerm = `%${query.trim()}%`;
  const sql = `
    SELECT r.id AS room_id, r.office_name, r.room_number, r.floor_level, r.operating_hours,
           b.id AS building_id, b.name AS building_name, b.code AS building_code, b.latitude, b.longitude
    FROM rooms r
    JOIN buildings b ON r.building_id = b.id
    WHERE r.office_name LIKE ? OR r.room_number LIKE ? OR b.name LIKE ? OR b.code LIKE ?
    LIMIT 10
  `;

  db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ query, match_count: results ? results.length : 0, results: results || [] });
  });
});

// Fallback: Serve UI for all non-API paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SLSU Kiosk Server running locally on http://localhost:${PORT}`);
});