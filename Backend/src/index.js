const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use('/users', userRoutes);
app.use('/skills', skillRoutes);
app.use('/requests', requestRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SkillSwap API' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});