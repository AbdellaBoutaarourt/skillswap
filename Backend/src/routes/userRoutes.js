const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sign up route
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').trim().isLength({ min: 3 }),
  body('bio').optional().trim(),
  body('skills').optional().isArray(),
  body('learning').optional().isArray(),

], async (req, res) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }




    const { email, password, username, bio, skills, firstName, lastName, location , availability, learning, social, avatar } = req.body;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          username,
          bio,
          skills,
          email,
          location,
          availability,
          social,
          avatar_url:avatar

        }
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    if (learning && learning.length > 0) {
      const learningGoals = learning.map(skill => ({
        user_id: authData.user.id,
        skill: skill,
      }));

      const { error: learningError } = await supabase
        .from('learning_goals')
        .upsert(learningGoals);

      if (learningError) throw learningError;
    }


    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profileData.username,
        bio: profileData.bio,
        skills: profileData.skills,
        learning: profileData.learning,
        availability: profileData.availability,
        location: profileData.location,
        avatar: profileData.avatar_url
      }
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ error: error.message });
}
});

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Check if the error is due to email not being confirmed
      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({
          error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
        });
      }
      throw authError;
    }

    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Get user's learning goals
    const { data: learningGoals, error: learningError } = await supabase
      .from('learning_goals')
      .select('skill')
      .eq('user_id', authData.user.id);

    if (learningError) throw learningError;

    res.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profileData.username,
        bio: profileData.bio,
        skills: profileData.skills,
        learning: learningGoals.map(goal => goal.skill),
        availability: profileData.availability,
        location: profileData.location,
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Resend confirmation email
router.post('/resend-confirmation', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;

    res.json({ message: 'Confirmation email has been resent' });
  } catch (error) {
    console.error('Error resending confirmation:', error.message);
    res.status(500).json({ error: 'Failed to resend confirmation email' });
  }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile/:id', [
  body('username').optional().trim().isLength({ min: 3 }),
  body('bio').optional().trim(),
  body('skills').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;