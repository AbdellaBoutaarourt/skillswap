# SkillSwap

SkillSwap is an innovative web application designed to help users learn, share, and combine skills with others, with AI integration for smart skill mashups. Using AI-powered matching and interactive sessions, SkillSwap makes it easy to find collaborators, join live sessions, and grow your expertise in a vibrant community.

## Table of Contents
- [SkillSwap](#skillswap)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
  - [User Guide](#user-guide)
    - [Registration \& Login](#registration--login)
    - [Exploring \& Matching](#exploring--matching)
    - [Skill Swap \& Sessions](#skill-swap--sessions)
    - [Profile \& Progress](#profile--progress)
  - [Documentation](#documentation)
    - [Technical Stack](#technical-stack)
  - [Resources \& Inspiration](#resources--inspiration)
    - [AI \& Matching](#ai--matching)
  - [Contributions](#contributions)
  - [License](#license)
---

## Installation

Follow the steps below to install and start the SkillSwap app locally:

1. **Clone the repository:**

```bash
git clone https://github.com/AbdellaBoutaarourt/skillswap
```

2. **Install the required packages:**

```bash
# For the backend
cd backend
npm install

# For the frontend
cd ../Frontend
npm install
```

3. **Environment variables:**

Create a `.env` file in both backend and frontend directories as needed :

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_supabase_key
```

For the backend, add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
```

1. **Start the development servers:**

```bash
# Start backend (default: http://localhost:5000)
cd backend
npm run dev

# Start the socket server (default: http://localhost:4000)
node socket.js

# Start frontend (default: http://localhost:5173)
cd ../Frontend
npm run dev
```

> **Note:**
> - Your backend API will be running at `http://localhost:5000` (unless configured otherwise).
> - The socket server must also be running at `http://localhost:4000` for real-time features (sessions, chat, etc.).

5. **Open the app:**

Go to `http://localhost:5173` (or the port shown in your terminal) to use SkillSwap.

---

## Features

- **AI Skill Matching:** Get personalized collaborator and project suggestions powered by AI.
- **Skill Swap Requests:** Send and receive requests to exchange skills with other users.
- **Live Sessions:** Join  skill-sharing sessions.
- **Messaging:** Message other users in real time.
- **User Profiles:** Showcase your skills, learning goals, and achievements.
- **Rating & Feedback:** Rate your mentors and receive feedback after sessions.
- **Secure Authentication:** Modern, secure login and registration.
- **Responsive Design:** Fully responsive for desktop and mobile.

---

## User Guide

### Registration & Login
- Sign up with your email and create your profile.
- Confirm your email address to activate your account.

### Exploring & Matching
- Use the Explore page to browse users and skills.
- Try the SkillMatch AI to get smart suggestions for collaborators and projects.

### Skill Swap & Sessions
- Send swap requests to connect and exchange skills.
- Join live sessions or schedule your own.
- After each session, rate your mentor or partner.

### Profile & Progress
- Update your profile with new skills and learning goals.
- Track your session history and feedback.

---

## Documentation

### Technical Stack
- [React.js](https://react.dev/) (Frontend)
- [Node.js / Express](https://expressjs.com/) (Backend)
- [Supabase](https://supabase.com/) (Authentication, storage, and database)
- [Framer Motion](https://www.framer.com/motion/) (Animations)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [shadcn/ui](https://ui.shadcn.com/docs/installation) (UI components)
- [Socket.IO](https://socket.io/) (Real-time communication)
- [React Router](https://reactrouter.com/) (Routing)
- [Axios](https://axios-http.com/) (API requests)
- [Sonner](https://sonner.emilkowal.ski/) (Notifications)
- [dotenv](https://www.npmjs.com/package/dotenv): Environment variable management
- [openai](https://platform.openai.com/docs/quickstart): OpenAI API client
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction): Supabase client for authentication and storage
- [nodemon](https://www.npmjs.com/package/nodemon) (dev): Auto-restart server on changes


## Resources & Inspiration
- [React Crash Course – Traversy Media (YouTube)](https://www.youtube.com/watch?v=w7ejDZ8SWv8)
- [How to use OpenAI API in Node.js (YouTube)](https://www.youtube.com/watch?v=L9VRxKT-hXc&t=80s&ab_channel=UnitedTopTech)
- [Socket.IO Tutorial (YouTube)](https://www.youtube.com/watch?v=ZKEqqIO7n-k)
- [Supabase Realtime Quickstart (YouTube)](https://www.youtube.com/watch?v=9vZTrBF-yOY&t=5s&ab_channel=CodeCommerce)


### AI & Matching
- AI features are powered by a backend endpoint (`/ai/skill-mashup`) that analyzes user prompts and suggests matches.

---

## Contributions

We welcome contributions! Please fork the repository and create a pull request with your changes. Ensure your code follows our style guidelines and is well-documented.

---

## License


This project is licensed under the MIT License. See the LICENSE file for details.