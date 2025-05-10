# SkillSwap Backend

Backend API for the SkillSwap application built with Node.js, Express, and Supabase.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository
2. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Users
- POST `/users/signup` - Create new user account
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "username": "username",
    "bio": "Optional bio",
    "skills": ["skill1", "skill2"]
  }
  ```
- GET `/users/profile/:id` - Get user profile
- PUT `/users/profile/:id` - Update user profile

### Skills
- GET `/skills` - Get all skills
- POST `/skills` - Create new skill
- GET `/skills/:id` - Get skill by ID

## Database Schema

### Profiles Table
- id (uuid, primary key)
- username (text)
- email (text)
- bio (text)
- skills (array)
- created_at (timestamp)

### Skills Table
- id (uuid, primary key)
- name (text)
- category (text)
- description (text)
- created_at (timestamp)