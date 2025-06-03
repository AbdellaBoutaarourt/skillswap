import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import defaultAvatar from "../assets/user.png";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { toast, Toaster } from "sonner";
import MultiSelect from "@/components/MultiSelect";

function Profile() {
  const [tab, setTab] = useState("skills");
  const [user, setUser] = useState({});
  const [form, setForm] = useState({
    username: user.username || "",
    location: user.location || "",
    bio: user.bio || "",
    skills: user.skills || [],
    learning: user.learning || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const { data } = await axios.get('http://localhost:5000/skills');
        const categories = {};
        data.forEach(skill => {
          if (!categories[skill.category]) {
            categories[skill.category] = [];
          }
          categories[skill.category].push(skill.name);
        });
        const options = Object.keys(categories).map(category => ({
          label: category,
          skills: categories[category]
        }));
        setAvailableSkills(options);
      } catch (err) {
        console.error('Erreur lors du chargement des compétences:', err);
      }
    }
    fetchSkills();
  }, []);

  async function fetchProfile() {
    try {
      const localUser = JSON.parse(localStorage.getItem('user'));
      const { data } = await axios.get(`http://localhost:5000/users/profile/${localUser.id}`);
      setUser(data);
      setForm(f => ({
        ...f,
        username: data.username || "",
        location: data.location || "",
        bio: data.bio || "",
        skills: data.skills || [],
        learning: data.learning || []
      }));
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    }
  }
  useEffect(() => {
    fetchProfile();
  }, []);

  let range = null;
  if (user.availability && user.availability.length === 2) {
    range = {
      from: new Date(user.availability[0]),
      to: new Date(user.availability[1])
    };
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        username: form.username,
        location: form.location,
        bio: form.bio,
        skills: form.skills,
        learning: form.learning
      };
      await axios.put(`http://localhost:5000/users/profile/${user.id}`, payload);

      setSuccess("Profile updated!");
      setOpen(false);
      toast.success("Profile updated!", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div className="min-h-screen bg-[#111B23] text-white flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
        <img
          src={user.avatar_url ||  defaultAvatar}
          alt="avatar"
          className="w-36 h-36 rounded-full border-4 border-blue-500 object-cover mb-4 md:mb-0"
        />
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="font-bold text-2xl md:text-2xl text-white">
             {user.first_name} {user.last_name}
            </div>
            <div className="text-blue-400 text-base mt-1">
              @{user.username}
            </div>
            <div className="text-gray-300 text-base mt-1">{user.location}</div>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <div className="flex">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={star <= Math.round(user.rating || 0) ? "text-yellow-400 text-lg" : "text-gray-500 text-lg"}>★</span>
                ))}
              </div>
              <span className="text-sm text-gray-300 ml-1">{user.rating ? user.rating.toFixed(1) : 0}/5</span>
            </div>
            <div className="flex gap-6 mt-4 justify-center md:justify-start">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{user.rating_count || 0}</span>
                <span className="text-sm text-gray-400">Reviews</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{user.skills?.length || 0}</span>
                <span className="text-sm text-gray-400">Skills</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 md:gap-6 justify-center md:justify-end">
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-white cursor-pointer hover:text-white bg-transparent text-white font-semibold rounded-lg px-8 py-2 h-11 text-base transition hover:bg-white/10">Edit profile</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#181f25] text-white">
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Edit your profile</AlertDialogTitle>
                  </AlertDialogHeader>
                  <div>
                    <label className="block text-sm mb-1">Username</label>
                    <Input name="username" value={form.username} onChange={handleChange} className="bg-[#232b32] text-white" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Location</label>
                    <Input name="location" value={form.location} onChange={handleChange} className="bg-[#232b32] text-white" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Bio</label>
                    <Input name="bio" value={form.bio} onChange={handleChange} className="bg-[#232b32] text-white" />
                  </div>
                  <MultiSelect
                    label="👨‍🎓 Which skills do you offer?"
                    options={availableSkills}
                    selected={form.skills}
                    setSelected={skills => setForm(f => ({ ...f, skills }))}
                  />
                  <MultiSelect
                    label="🎯 What do you want to learn?"
                    options={availableSkills}
                    selected={form.learning}
                    setSelected={learning => setForm(f => ({ ...f, learning }))}
                  />
                  {error && <div className="text-red-400 text-sm">{error}</div>}
                  {success && <div className="text-green-400 text-sm">{success}</div>}
                  <AlertDialogFooter>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    <AlertDialogCancel type="button" className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white px-6 cursor-pointer">Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 py-2 h-11 text-base transition">Share profile</Button>
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl mb-8">
        <div className="font-bold text-xl mb-2 text-white">About</div>
        <div className="text-white text-base leading-snug">{user.bio || "No bio provided."}</div>
      </div>
      <div className="w-full max-w-4xl flex justify-between border-b border-gray-400 mb-8">
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('skills')}
        >
          Skills
          {tab === 'skills' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-full transition-all duration-300" />
          )}
        </button>
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('availability')}
        >
          Availability
          {tab === 'availability' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-full transition-all duration-300" />
          )}
        </button>
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('stats')}
        >
          Stats
          {tab === 'stats' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-full transition-all duration-300" />
          )}
        </button>
      </div>
      <div className="w-full max-w-4xl text-left">
        {tab === "skills" && (
          <div>
            <div className="mb-8">
              <div className="font-bold text-xl mb-3 text-white">Skills</div>
              <div className="flex flex-wrap gap-4">
                {(user.skills && user.skills.length > 0 ? user.skills : ["No skills"]).map(skill => (
                  <span key={skill} className="border border-white rounded-lg px-5 py-2 text-base text-white bg-transparent font-normal">{skill}</span>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <div className="font-bold text-xl mb-3 text-white">Skills desired</div>
              <div className="flex flex-wrap gap-4">
                {(user.learning && user.learning.length > 0 ? user.learning : ["No learning goals"]).map(skill => (
                  <span key={skill} className="border border-white rounded-lg px-5 py-2 text-base text-white bg-transparent font-normal">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "availability" && (
          <div>
            <div className="font-bold text-xl mb-3 text-white">Availability</div>
            {range && (
              <div className="flex gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">From</span>
                  <span className="border border-white rounded-lg px-5 py-2 text-base text-white bg-transparent font-normal">
                    {range.from && range.from.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1">To</span>
                  <span className="border border-white rounded-lg px-5 py-2 text-base text-white bg-transparent font-normal">
                    {range.to && range.to.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
            <div className="bg-[#181f25] rounded-xl p-4 w-full max-w-2xl mx-auto flex justify-center">
              <Calendar
                mode="range"
                selected={range}
                numberOfMonths={2}
                showOutsideDays
                className="bg-transparent"
                disabled
                modifiersClassNames={{
                  selected: 'bg-blue-600 text-white',
                  range_start: 'bg-blue-600 text-white',
                  range_end: 'bg-blue-600 text-white',
                  range_middle: 'bg-blue-600/60 text-white',
                }}
              />
            </div>
          </div>
        )}
        {tab === "stats" && (
          <div>
            <div className="font-bold text-xl mb-3 text-white">SkillSwap Stats</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Mentor Sessions Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Mentor Impact</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Knowledge swapped as a mentor</p>
                <p className="text-2xl font-bold text-white mt-2">{user.teaching_sessions?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Sessions where you empowered others.</p>
              </div>
              {/* Learning Sessions Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Learning Journey</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Times you&apos;ve gained knowledge</p>
                <p className="text-2xl font-bold text-white mt-2">{user.learning_sessions?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-1">sessions completed</p>
              </div>
              {/* Community Feedback Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Community Feedback</h3>
                    <p className="text-sm text-gray-400">Based on {user.rating_count || 0} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={star <= Math.round(user.rating || 0) ? "text-yellow-400" : "text-gray-500"}>★</span>
                    ))}
                  </div>
                  <span className="text-md font-bold text-white">{user.rating ? user.rating.toFixed(1) : 0}/5</span>
                </div>
                <p className="text-xs text-gray-400">Based on {user.rating_count || 0} reviews</p>
              </div>
              {/* Expertise Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">SkillMastery</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Skills you&apos;ve unlocked</p>
                <p className="text-2xl font-bold text-white mt-2">{user.skills?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-1">skills mastered</p>
              </div>
              {/* Time in Community Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Time in Community</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Member since ({new Date(user.created_at).toLocaleDateString('en-US', {month: 'long', year: 'numeric' }) })</p>
                <p className="text-2xl font-bold text-white mt-2">{user.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0} Days</p>
                <p className="text-xs text-gray-400 mt-1">days in the community</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}

export default Profile;