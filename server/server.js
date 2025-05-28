const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const resumeRoutes = require('./routes/resumeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', resumeRoutes); // Use routes from resumeRoutes

// Health check route
app.get('/', (req, res) => {
  res.send('Project is running');
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
