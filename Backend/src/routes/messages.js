const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/count/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all messages where the user
router.get('/conversations/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map();

      for (const msg of messages) {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

        if (!conversationsMap.has(otherUserId)) {
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', userId)
            .eq('read', false);

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, first_name, avatar_url, location')
            .eq('id', otherUserId)
            .single();

          if (userError) throw userError;

          conversationsMap.set(otherUserId, {
            otherUser: userData,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount || 0,
          });
        }
      }

      res.json(Array.from(conversationsMap.values()));
    } catch (err) {
      console.error('Error getting conversations:', err);
      res.status(500).json({ error: err.message });
    }
  });


router.get('/chat/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .eq('read', false);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;

    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        sender_id,
        receiver_id,
        content,
        read: false
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
