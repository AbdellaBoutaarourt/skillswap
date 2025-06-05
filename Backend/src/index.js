const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');
const messageRoutes = require('./routes/messages');
const sessionsRouter = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/users', userRoutes);
app.use('/skills', skillRoutes);
app.use('/requests', requestRoutes);
app.use('/messages', messageRoutes);
app.use('/sessions', sessionsRouter);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SkillSwap API' });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});