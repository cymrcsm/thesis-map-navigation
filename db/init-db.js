const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
const dbPath = path.join(__dirname, 'slsu_directory.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`CREATE TABLE buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT CHECK(category IN ('Administrative', 'Academic', 'Services', 'Amenities')) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    total_floors INTEGER DEFAULT 1,
    description TEXT
  );`);

  db.run(`CREATE TABLE floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    floor_level INTEGER NOT NULL,
    floor_plan_image TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    UNIQUE(building_id, floor_level)
  );`);

  db.run(`CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    floor_level INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    office_name TEXT NOT NULL,
    department_head TEXT,
    operating_hours TEXT DEFAULT '8:00 AM - 5:00 PM',
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
  );`);

  // Seed Real SLSU Main Campus Coordinates (Brgy. San Roque, Sogod)
  const insertBuilding = db.prepare(`INSERT INTO buildings (name, code, category, latitude, longitude, total_floors, description) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  // Admin Building
  insertBuilding.run('Administration Building', 'ADMIN', 'Administrative', 10.39167, 124.97972, 2, 'Main administrative offices, Registrar, and Cashier.');
  
  // COECS Building
  insertBuilding.run('College of Engineering & Computer Studies', 'COECS', 'Academic', 10.39210, 124.98010, 3, 'Classrooms, computer laboratories, and faculty offices.');
  
  // SLSU Main Library
  insertBuilding.run('SLSU Main Library', 'LIB', 'Services', 10.39130, 124.97920, 2, 'University library, discussion rooms, and digital archives.');
  
  insertBuilding.finalize();

  // Seed Floors
  const insertFloor = db.prepare(`INSERT INTO floors (building_id, floor_level, floor_plan_image) VALUES (?, ?, ?)`);
  insertFloor.run(1, 1, '/assets/floorplans/admin_fl1.png');
  insertFloor.run(1, 2, '/assets/floorplans/admin_fl2.png');
  insertFloor.run(2, 1, '/assets/floorplans/coecs_fl1.png');
  insertFloor.finalize();

  // Seed Rooms
  const insertRoom = db.prepare(`INSERT INTO rooms (building_id, floor_level, room_number, office_name, department_head, operating_hours) VALUES (?, ?, ?, ?, ?, ?)`);
  insertRoom.run(1, 1, '101', 'Office of the University Registrar', 'Dr. Maria Santos', '8:00 AM - 5:00 PM');
  insertRoom.run(1, 1, '102', 'Cashier & Assessment Office', 'Mr. Juan Dela Cruz', '8:00 AM - 4:00 PM');
  insertRoom.run(1, 2, '201', 'Office of the University President', 'Dr. Prose Ivy G. Yepes', '8:00 AM - 5:00 PM');
  insertRoom.run(2, 1, 'Lab 1', 'Computer Laboratory 1', 'Engr. Alex Reyes', '7:30 AM - 6:00 PM');
  insertRoom.finalize();

  console.log('✔ SLSU Database re-initialized with updated campus coordinates.');
});

db.close();