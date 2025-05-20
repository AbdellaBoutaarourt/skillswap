const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/accept/:requestId', async (req, res) => {
  const { requestId } = req.params;
  try {
    // Update request status to accepted
    const { data: request, error: updateError } = await supabase
      .from('skill_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;



    res.json({ request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline a skill request
router.post('/decline/:requestId', async (req, res) => {
  const { requestId } = req.params;
  try {
    const { data, error } = await supabase
      .from('skill_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;