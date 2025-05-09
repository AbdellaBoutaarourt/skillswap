import logo from "../assets/logo1.png";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';

const skills = [
  { title: "Programming", desc: "Web, mobile, AI, more", img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80" },
  { title: "Design", desc: "UI/UX, graphic, branding", img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" },
  { title: "Cooking", desc: "Baking, world cuisine", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" },
  { title: "Marketing", desc: "Digital, content, SEO", img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80" },
  { title: "Languages", desc: "English, French, Spanish", img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" },
  { title: "Sport", desc: "Football, yoga, dance", img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80" },
];

const users = [
  { name: "Alice", skills: ["Design", "Marketing"], avatar: "https://randomuser.me/api/portraits/women/44.jpg", rating: 4.9 },
  { name: "Bob", skills: ["Programming", "AI"], avatar: "https://randomuser.me/api/portraits/men/32.jpg", rating: 4.7 },
  { name: "Sophie", skills: ["Cooking", "Languages"], avatar: "https://randomuser.me/api/portraits/women/65.jpg",  rating: 4.5 },
];

const sortedUsers = [...users].sort((a, b) => b.rating - a.rating);

const Home = () => {
  useEffect(() => {
    AOS.init({ once: true, duration: 700 });
  }, []);

  return (
    <div className=" text-white p-0 mt-3 mx-5">

      <section className="w-full flex flex-col items-center" data-aos="fade-up">
        <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
            alt="Hero background"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="flex  flex-col justify-center items-center p-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">Master a new skill</h2>
            <p className="mb-4 text-base md:text-lg">Explore and learn from other members. Share your own expertise.</p>
            <div className="flex w-full max-w-xl mx-auto bg-white rounded-xl shadow items-center overflow-hidden mt-4">
              <span className="flex items-center justify-center px-4 text-gray-400 text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="search"
                className="flex-1 px-4 py-3 text-black bg-transparent focus:outline-none placeholder-gray-400 text-lg"
              />
              <button className="bg-button cursor-pointer hover:bg-blue-700 text-white font-bold rounded-lg px-6 py-2 m-2 transition hover:shadow focus:outline-none">
                Start learning
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-12" data-aos="fade-up">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Popular Skills</h3>
            <p className="text-gray-300 text-sm md:text-base mt-1">The most requested or exchanged skills on the platform.</p>
          </div>
          <button className="bg-button hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm cursor-pointer transition-transform duration-150 hover:scale-105 hover:shadow-lg active:scale-95">Explore</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {skills.map((skill) => (
            <div key={skill.title} className="bg-[#181f25] rounded-xl overflow-hidden shadow flex flex-col items-center p-2 transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" data-aos="zoom-in">
              <img src={skill.img} alt={skill.title} className="w-full h-20 object-cover rounded-md mb-2 transition-transform duration-200 group-hover:scale-110" />
              <div className="text-center">
                <div className="font-bold text-base md:text-lg">{skill.title}</div>
                <div className="text-xs md:text-sm text-gray-300">{skill.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-14" data-aos="fade-up">
        <div className="flex flex-col md:flex-row items-center justify-between bg-[#181f25] rounded-xl p-8 shadow mb-6">
          <div className="flex-1 mb-4 md:mb-0 md:mr-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">🧪 What is Skill Matchup?</h3>
            <p className="text-gray-300 text-base md:text-lg mb-4">
              Skill Matchup is a unique feature of Skillswap that uses AI to connect you with the best learning partners and projects. Describe your goals or interests, and our AI will suggest personalized skill exchanges, project ideas, or learning buddies to help you grow faster and smarter.
            </p>
            <button className="bg-button hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-base cursor-pointer transition-transform duration-150 hover:scale-105 hover:shadow-lg active:scale-95">Try Skill Matchup AI</button>
          </div>
          <img src={logo} alt="Skill Matchup" className="w-48 object-cover rounded-lg shadow-lg transition-transform duration-200 hover:scale-105 hover:rotate-2 cursor-pointer" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-14" data-aos="fade-up">
        <div className="mb-4">
          <h3 className="text-2xl md:text-3xl font-bold">🌟 Featured Users / Top Contributors</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedUsers.map((u) => (
            <div key={u.name} className="bg-[#181f25] rounded-xl overflow-hidden shadow flex flex-col items-center p-4 transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer" data-aos="zoom-in">
              <img src={u.avatar} alt={u.name} className="w-16 h-16 rounded-full mb-2 border-2 border-button transition-transform duration-200 hover:scale-110" />
              <div className="font-bold text-lg">{u.name}</div>
              <div className="flex flex-wrap justify-center gap-1 mt-1 mb-2">
                {u.skills.map((s) => (
                  <span key={s} className="bg-button text-white text-xs px-2 py-0.5 rounded-xl transition-transform duration-150 hover:scale-105 cursor-pointer">{s}</span>
                ))}
              </div>
              <div className="flex items-center mb-1">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} className={`w-4 h-4 ${i <= Math.round(u.rating) ? 'text-yellow-400' : 'text-gray-500'} transition-colors duration-150 cursor-pointer hover:text-yellow-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                ))}
                <span className="ml-2 text-sm text-gray-200 font-semibold">{u.rating.toFixed(1)}/5</span>
              </div>
              <span className="text-xs text-yellow-400 font-semibold">{u.badge}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto mt-16 mb-8 text-center" data-aos="fade-up">
        <hr className="border-gray-600 mb-8" />
        <h3 className="text-2xl md:text-3xl font-bold mb-6">Start your skill exchange journey now</h3>
        <button className="bg-button hover:bg-[#1977c7] text-white px-6 py-2 rounded-lg font-semibold text-lg cursor-pointer transition-transform duration-150 hover:scale-105 hover:shadow-lg active:scale-95">Start learning</button>
      </section>
    </div>
  );
};

export default Home;
