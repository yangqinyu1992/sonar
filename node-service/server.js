const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
// The MONGO_URI is provided by the Docker environment, defaulting to a local instance for non-Docker development.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// A simple schema for demonstration
const ItemSchema = new mongoose.Schema({
  name: String,
  date: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);

app.get('/', (req, res) => {
  res.send('Hello from Node.js service! Connected to MongoDB.');
});

// Endpoint to add an item to the database
app.get('/add', async (req, res) => {
  try {
    const newItem = new Item({ name: `Item ${Date.now()}` });
    await newItem.save();
    res.status(201).send(`Added new item: ${newItem.name}`);
  } catch (error) {
    res.status(500).send('Error adding item to database.');
  }
});

// Endpoint to list items
app.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).send('Error fetching items from database.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
