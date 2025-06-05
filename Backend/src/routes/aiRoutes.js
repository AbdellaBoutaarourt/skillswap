const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/skill-mashup', async (req, res) => {
  const { prompt, userId } = req.body;

  // Fetch all users and skills from the database
  let { data: users } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, skills, avatar_url');
  const { data: skills } = await supabase.from('skills').select('*');

  if (userId) {
    users = users.filter(u => u.id !== userId);
  }

  const systemPrompt = `
You are SkillMatch AI. Here is a list of all users and skills in the platform.
Each user has an id (UUID), a username, and a list of skills (array of skill names).
USERS: ${JSON.stringify(users)}
SKILLS: ${JSON.stringify(skills)}
The user said: "${prompt}"
Your mission:
- Suggest the relevant skills for this idea or skill
- Suggest the best users to match with (by id, use the "id" field from USERS, which is a UUID string) for collaboration, based on complementary or matching skills
- In the users array, return only the UUIDs (id field) from USERS, not names or skills.
- Suggest creative project ideas (fusions) that combine the user's skill/idea with others. When suggesting a fusion, use the real name of the suggested user from the USERS list (e.g. 'You could team up with John Doe to create and promote an online store.')
- Suggest learning paths (steps to achieve the project or learn the skill)
- For the best user match, explain the concept in 1-2 sentences (e.g., "You are a developer, you could team up with a designer to build a site for learning to code.")
Return only valid JSON like:
{
  "skills": [...],
  "fusions": [...],
  "paths": [...],
  "users": [id, id, ...], // only UUIDs from USERS
  "explanation": "..."
}
If you cannot find a relevant user, return an empty array for users.

Example USERS:
[
  { "id": "uuid-1", "username": "alice", "skills": ["Mobile App Development", "React Native"] },
  { "id": "uuid-2", "username": "bob", "skills": ["Graphic Design", "UI/UX"] }
]
If the user wants to learn mobile app development, suggest uuid-1 as a match.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = completion.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const match = content.match(/```json\\s*([\\s\\S]*?)```/);
      result = match ? JSON.parse(match[1]) : null;
    }

    if (!result) throw new Error('Invalid JSON from AI');

    // Always match users by detected skills from AI
    let usersMatched = [];
    if (result.skills && result.skills.length > 0) {
      // Get the list of detected skill names
      const skillNames = result.skills.map(s => typeof s === 'string' ? s : s.name);
      usersMatched = users.filter(u =>
        Array.isArray(u.skills) && u.skills.some(userSkill =>
          skillNames.includes(userSkill)
        )
      );
    }

    // Deduplicate users by id (in case both methods return some)
    const seen = new Set();
    usersMatched = usersMatched.filter(u => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });


    res.json({
      skills: result.skills || [],
      fusions: result.fusions || [],
      paths: result.paths || [],
      users: usersMatched,
      explanation: result.explanation || ""
    });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

module.exports = router;
