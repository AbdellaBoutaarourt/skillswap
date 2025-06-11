const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a new session
router.post('/', async (req, res) => {
  const {
    skill_request_id,
    scheduled_by,
    scheduled_with,
    date,
    start_time,
    end_time,
    mode,
    location,
    notes
  } = req.body;

  try {


    // Verify the validity of the skill/combine request
    if (skill_request_id) {
      const { data: skillRequest, error: skillRequestError } = await supabase
        .from('skill_requests')
        .select('*')
        .eq('id', skill_request_id)
        .eq('status', 'accepted')
        .single();
      if (skillRequestError || !skillRequest) {
        return res.status(400).json({ message: 'Invalid or non-accepted skill request' });
      }
    }

    // Create the session
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        skill_request_id: skill_request_id || null,
        scheduled_by,
        scheduled_with,
        date,
        start_time,
        end_time,
        mode,
        location,
        notes
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session' });
  }
});

// Get all sessions for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .or(`scheduled_by.eq.${userId},scheduled_with.eq.${userId}`)
      .order('date', { ascending: false });

    if (error) throw error;

    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      let skillName = null;
      if (session.skill_request_id) {
        const { data: skillRequest, error: skillRequestError } = await supabase
          .from('skill_requests')
          .select('requested_skill')
          .eq('id', session.skill_request_id)
          .single();
        if (!skillRequestError && skillRequest?.requested_skill) {
          skillName = skillRequest.requested_skill;
        }
      }
      return { ...session, skill_name: skillName };
    }));

    res.json(enrichedSessions);
  } catch (error) {
    console.error('Error fetching sessions for user:', error);
    res.status(500).json({ message: 'Error fetching sessions for user' });
  }
});

// Get all sessions between two users
router.get('/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .or(`and(scheduled_by.eq.${user1},scheduled_with.eq.${user2}),and(scheduled_by.eq.${user2},scheduled_with.eq.${user1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // for each session, take name of skill
    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      let skillName = null;
      if (session.skill_request_id) {
        const { data: skillRequest, error: skillRequestError } = await supabase
          .from('skill_requests')
          .select('requested_skill')
          .eq('id', session.skill_request_id)
          .single();
        if (!skillRequestError && skillRequest?.requested_skill) {
          skillName = skillRequest.requested_skill;
        }
      }
      return { ...session, skill_name: skillName };
    }));

    res.json(enrichedSessions);
  } catch (error) {
    console.error('Error fetching sessions between users:', error);
    res.status(500).json({ message: 'Error fetching sessions between users' });
  }
});

// Get a specific session
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get skill name from skill request
    const { data: skillRequest, error: skillRequestError } = await supabase
      .from('skill_requests')
      .select('requested_skill')
      .eq('id', data.skill_request_id)
      .single();

    if (!skillRequestError && skillRequest?.requested_skill) {
      data.skill_name = skillRequest.requested_skill;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Error fetching session' });
  }
});

// Update session status (accept/decline)
router.patch('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.body;
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Error updating session status' });
  }
});

// Rate a session
router.patch('/:id/rate', async (req, res) => {
  const sessionId = req.params.id;
  const { rating } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Invalid rating' });
  }
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ rated: true, given_rating: rating })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;