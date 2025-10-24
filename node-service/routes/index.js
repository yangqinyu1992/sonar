const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello from Node.js service! Connected to MongoDB.');
});

module.exports = router;
