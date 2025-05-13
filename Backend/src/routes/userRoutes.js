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

    const { email, password, username, bio, skills, firstName, lastName, location, availability, learning, social, avatar } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create user profile
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
          avatar_url: avatar
        }
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    if (learning && learning.length > 0) {
      // Get skill IDs for the learning goals
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', learning);

      if (skillsError) throw skillsError;

      const skillMap = skillsData.reduce((acc, skill) => {
        acc[skill.name] = skill.id;
        return acc;
      }, {});

      const learningGoals = learning
        .filter(skillName => skillMap[skillName])
        .map(skillName => ({
          user_id: authData.user.id,
          skill_id: skillMap[skillName],
          created_at: new Date().toISOString()
        }));

      if (learningGoals.length > 0) {
        const { error: learningError } = await supabase
          .from('learning_goals')
          .insert(learningGoals);

        if (learningError) throw learningError;
      }
    }

    const { data: learningGoals, error: learningError } = await supabase
      .from('learning_goals')
      .select(`
        skill:skills (
          name
        ),
        created_at
      `)
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (learningError) throw learningError;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profileData.username,
        bio: profileData.bio,
        skills: profileData.skills,
        learning: learningGoals.map(goal => goal.skill.name),
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {

      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({
          error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
        });
      }
      throw authError;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Get user's learning goals
    const { data: learningGoals, error: learningError } = await supabase
      .from('learning_goals')
      .select('skills(name)')
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
        learning: learningGoals.map(goal => goal.skills.name),
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
      .from('users')
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
  body('skills').optional().isArray(),
  body('learning').optional().isArray(),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { learning, ...profileData } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (learning) {
      const { error: deleteError } = await supabase
        .from('learning_goals')
        .delete()
        .eq('user_id', req.params.id);

      if (deleteError) throw deleteError;

      if (learning.length > 0) {
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name')
          .in('name', learning);

        if (skillsError) throw skillsError;

        const skillMap = skillsData.reduce((acc, skill) => {
          acc[skill.name] = skill.id;
          return acc;
        }, {});

        const learningGoals = learning
          .filter(skillName => skillMap[skillName])
          .map(skillName => ({
            user_id: req.params.id,
            skill_id: skillMap[skillName],
            created_at: new Date().toISOString()
          }));

        if (learningGoals.length > 0) {
          const { error: learningError } = await supabase
            .from('learning_goals')
            .insert(learningGoals);

          if (learningError) throw learningError;
        }
      }
    }

    const { data: learningGoals, error: learningError } = await supabase
      .from('learning_goals')
      .select(`
        skill:skills (
          name
        ),
        created_at
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    if (learningError) throw learningError;

    res.json({
      ...data,
      learning: learningGoals.map(goal => goal.skill.name)
    });
  } catch (error) {
    console.error('Update profile error:', error.message, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.json({ message: 'If your email is registered, you will receive a password reset link.' });
    }

    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password'
    });

    if (resetError) throw resetError;

    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (error) {
    console.error('Error sending password reset:', error.message);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });

    if (sessionError) throw sessionError;

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) throw updateError;

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur de réinitialisation:', error.message);
    res.status(400).json({ error: 'Token invalide ou expiré.' });
  }
});


module.exports = router;