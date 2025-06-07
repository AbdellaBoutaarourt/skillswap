import logo from "../assets/logo1.png";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import defaultAvatar from "../assets/user.png";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [skills, setSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const searchInputRef = useRef(null);

  useEffect(() => {
    AOS.init({
      once: false,
      duration: 700,
      offset: 100,
      easing: 'ease-in-out'
    });

    axios.get('http://localhost:5000/users/explore')
      .then(res => {
        //sort the users by rating in descending order and take the top 3
        const sorted = [...res.data].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
        setTopUsers(sorted);
      })
      .catch(() => setTopUsers([]));

    axios.get('http://localhost:5000/skills')
      .then(res => {
        // Sort by ID and take first 6 skills
        const sortedSkills = [...res.data].sort((a, b) => a.id - b.id).slice(0, 6);
        setSkills(sortedSkills);
        setIsLoadingSkills(false);
      })
      .catch(err => {
        console.error('Error fetching skills:', err);
        setIsLoadingSkills(false);
      });
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`;
      }, 1000);
    }
  };

  return (
    <div className="text-white p-0 mt-3 mx-5">
      <section className="w-full flex flex-col items-center" data-aos="fade-up">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg"
        >
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
            alt="Hero background"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="flex flex-col justify-center items-center p-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold mb-2"
            >
              Master a new skill
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 text-base md:text-lg"
            >
              Explore and learn from other members. Share your own expertise.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex w-full max-w-xl mx-auto bg-white rounded-xl shadow items-center overflow-hidden mt-4"
            >
              <span className="flex items-center justify-center px-4 text-gray-400 text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for skills or users..."
                className="flex-1 px-4 py-3 text-black bg-transparent focus:outline-none placeholder-gray-400 text-lg"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="bg-button cursor-pointer hover:bg-blue-700 text-white font-bold rounded-lg px-6 py-2 m-2 transition hover:shadow focus:outline-none"
              >
                {isSearching ? 'Searching...' : 'Start learning'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto mt-12" data-aos="fade-up">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Popular Skills</h3>
            <p className="text-gray-300 text-sm md:text-base mt-1">The most requested or exchanged skills on the platform.</p>
          </div>
          <Link to="/explore">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-button hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-transform duration-150 hover:shadow-lg"
            >
              Explore
            </motion.button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {isLoadingSkills ? (
            Array(6).fill(0).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#181f25] rounded-xl overflow-hidden shadow flex flex-col items-center p-2 h-32 animate-pulse"
              >
                <div className="w-full h-20 bg-gray-700 rounded-md mb-2" />
                <div className="w-3/4 h-4 bg-gray-700 rounded mb-1" />
                <div className="w-1/2 h-3 bg-gray-700 rounded" />
              </motion.div>
            ))
          ) : (
            skills.map((skill, index) => (
              <Link
                key={skill.id}
                to={`/explore?category=${encodeURIComponent(skill.category)}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="h-full bg-[#181f25] rounded-xl overflow-hidden shadow flex flex-col items-center p-2 transition-all duration-200 hover:shadow-2xl cursor-pointer"
                >
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={skill.image_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80"}
                    alt={skill.name}
                    className="w-full h-20 object-cover rounded-md mb-2 transition-transform duration-200"
                  />
                  <div className="text-center h-full flex flex-col justify-between">
                    <div className="font-bold text-base md:text-lg">{skill.name}</div>
                    <div className="text-xs md:text-sm text-gray-300">{skill.category}</div>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-14" data-aos="fade-up">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex flex-col md:flex-row items-center justify-between bg-[#181f25] rounded-xl p-8 shadow mb-6"
        >
          <div className="flex-1 mb-4 md:mb-0 md:mr-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">🧪 What is Skill Matchup?</h3>
            <p className="text-gray-300 text-base md:text-lg mb-4">
              Skill Matchup is a unique feature of Skillswap that uses AI to connect you with the best learning partners and projects. Describe your goals or interests, and our AI will suggest personalized skill exchanges, project ideas, or learning buddies to help you grow faster and smarter.
            </p>
            <Link to="/mashups">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-button hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-base cursor-pointer transition-transform duration-150 hover:shadow-lg"
              >
                Try Skill Matchup AI
              </motion.button>
            </Link>
          </div>
          <motion.img
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={logo}
            alt="Skill Matchup"
            className="w-48 object-cover rounded-lg shadow-lg transition-transform duration-200 cursor-pointer"
          />
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto mt-14" data-aos="fade-up">
        <div className="mb-4">
          <h3 className="text-2xl md:text-3xl font-bold">🌟 Featured Users / Top Contributors</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-[#181f25] rounded-xl shadow flex flex-col justify-between items-center p-4 transition-all duration-200 hover:shadow-2xl cursor-pointer"
            >
              <Link to={`/profile/${user.id}`} className="flex flex-col items-center w-full">
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={user.avatar || defaultAvatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full mb-2 border-2 border-button object-cover transition-transform duration-200"
                />
                <div className="font-bold text-lg">{user.name}</div>
              </Link>
              <div className="flex flex-wrap justify-center gap-1 mt-1 mb-2">
                {user.skills?.map((s) => (
                  <motion.span
                    key={s}
                    whileHover={{ scale: 1.1 }}
                    className="bg-button text-white text-xs px-2 py-0.5 rounded-xl"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
              <div className="flex items-center mb-1">
                {[1,2,3,4,5].map(star => (
                  <motion.span
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    className={star <= Math.round(user.rating) ? "text-yellow-400" : "text-gray-500"}
                  >
                    ★
                  </motion.span>
                ))}
                <span className="ml-2 text-sm text-gray-200 font-semibold">{user.rating?.toFixed(1) || "0.0"}/5</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto mt-16 mb-8 text-center" data-aos="fade-up">
        <hr className="border-gray-600 mb-8" />
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold mb-6"
        >
          Start your skill exchange journey now
        </motion.h3>
        <Link to="/explore">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-button hover:bg-[#1977c7] text-white px-6 py-2 rounded-lg font-semibold text-lg cursor-pointer transition-transform duration-150 hover:shadow-lg"
          >
            Start learning
          </motion.button>
        </Link>
      </section>
    </div>
  );
};

export default Home;
