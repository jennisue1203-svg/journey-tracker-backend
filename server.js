const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Initialize data file with default journey
async function initializeData() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      journeys: [
        {
          id: 1,
          name: "Appalachian Trail",
          totalMiles: 2190,
          totalSteps: 4598400,
          currentSteps: 0,
          members: ["You", "Husband"],
          createdAt: new Date().toISOString()
        }
      ]
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read data
async function readData() {
  const data = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Write data
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all journeys
app.get('/api/journeys', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.journeys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journeys' });
  }
});

// Create new journey
app.post('/api/journeys', async (req, res) => {
  try {
    const { name, totalMiles, members } = req.body;
    const data = await readData();
    
    const newJourney = {
      id: data.journeys.length > 0 ? Math.max(...data.journeys.map(j => j.id)) + 1 : 1,
      name,
      totalMiles,
      totalSteps: Math.round(totalMiles * 2100),
      currentSteps: 0,
      members: members || ["You", "Husband"],
      createdAt: new Date().toISOString()
    };
    
    data.journey
