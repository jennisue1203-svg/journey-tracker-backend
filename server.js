const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

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

async function readData() {
  const data = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/journeys', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.journeys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journeys' });
  }
});

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
    
    data.journeys.push(newJourney);
    await writeData(data);
    res.json(newJourney);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create journey' });
  }
});

app.post('/api/journeys/:id/steps', async (req, res) => {
  try {
    const { id } = req.params;
    const { steps, memberName } = req.body;
    const data = await readData();
    
    const journey = data.journeys.find(j => j.id === parseInt(id));
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    journey.currentSteps += steps;
    journey.lastUpdated = new Date().toISOString();
    journey.lastUpdatedBy = memberName;
    
    await writeData(data);
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add steps' });
  }
});

app.delete('/api/journeys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    
    data.journeys = data.journeys.filter(j => j.id !== parseInt(id));
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete journey' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
