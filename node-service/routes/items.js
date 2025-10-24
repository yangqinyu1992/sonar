const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const ItemSchema = new mongoose.Schema({
  name: String,
  date: { type: Date, default: Date.now }
});
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

// List items: GET /api/items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).send('Error fetching items from database.');
  }
});

// Add item (GET for compatibility): GET /api/items/add
router.get('/add', async (req, res) => {
  try {
    const newItem = new Item({ name: `Item ${Date.now()}` });
    await newItem.save();
    res.status(201).send(`Added new item: ${newItem.name}`);
  } catch (error) {
    res.status(500).send('Error adding item to database.');
  }
});

// Add item (preferred): POST /api/items
router.post('/', express.json(), async (req, res) => {
  try {
    const name = req.body?.name || `Item ${Date.now()}`;
    const newItem = new Item({ name });
    await newItem.save();
    res.status(201).json({ id: newItem._id, name: newItem.name });
  } catch (error) {
    res.status(500).send('Error adding item to database.');
  }
});

module.exports = router;
