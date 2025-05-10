const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get user profile

module.exports = router;