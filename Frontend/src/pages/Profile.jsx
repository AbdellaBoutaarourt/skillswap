import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import defaultAvatar from "../assets/user.png";
import axios from "axios";
import PropTypes from "prop-types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

const badgeIcons = [
  <svg key={1} width="40" height="40" fill="none" stroke="#232b32" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15l4-4 4 4"/></svg>,
  <svg key={2} width="40" height="40" fill="none" stroke="#232b32" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
  <svg key={3} width="40" height="40" fill="none" stroke="#232b32" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
];

function MultiSelect({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef();

  const filtered = options.map(cat => ({
    ...cat,
    skills: cat.skills.filter(skill => skill.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.skills.length > 0);

  function toggleSkill(skill) {
    if (selected.includes(skill)) {
      setSelected(selected.filter(s => s !== skill));
    } else {
      setSelected([...selected, skill]);
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-white">{label}</label>
      <div className="relative" ref={inputRef}>
        <input
          className="w-full px-3 py-2 bg-[#232b32] text-white rounded border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search skills..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selected.map(skill => (
              <span key={skill} className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs flex items-center gap-1">
                {skill}
                <button type="button" className="ml-1" onClick={e => { e.stopPropagation(); toggleSkill(skill); }}>×</button>
              </span>
            ))}
          </div>
        )}
        {open && (
          <div className="absolute z-20 bg-[#232b32] border border-gray-700 rounded mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
            {filtered.length === 0 && <div className="p-3 text-gray-400 text-sm">No skills found</div>}
            {filtered.map(cat => (
              <div key={cat.label}>
                <div className="px-3 py-2 text-xs text-gray-400 font-semibold">{cat.label}</div>
                {cat.skills.map(skill => (
                  <label key={skill} className="flex items-center px-3 py-1 cursor-pointer hover:bg-blue-900/30">
                    <input
                      type="checkbox"
                      checked={selected.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="accent-blue-500 mr-2"
                    />
                    <span className="text-white text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

MultiSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      skills: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelected: PropTypes.func.isRequired
};

function Profile() {
  const [tab, setTab] = useState("skills");
  const user = JSON.parse(localStorage.getItem('user'));
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
      const { data } = await axios.put(`http://localhost:5000/users/profile/${user.id}`, payload);

      // Update local storage with new data
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess("Profile updated!");
      setOpen(false);
      window.location.reload();
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
    <div className="min-h-screen bg-[#101820] text-white flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
        <img
          src={user.avatar ||  defaultAvatar}
          alt="avatar"
          className="w-36 h-36 rounded-full border-2 border-white object-cover mb-4 md:mb-0"
        />
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="font-bold text-2xl md:text-2xl text-white">
             {user.firstName} {user.lastName}
            </div>
            <div className="text-blue-400 text-base mt-1">
              @{user.username}
            </div>
            <div className="text-gray-300 text-base mt-1">{user.location || ""}</div>
          </div>
          <div className="flex gap-4 md:gap-6 justify-center md:justify-end">
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-white cursor-pointer text-black font-semibold rounded-lg px-8 py-2 h-11 text-base transition hover:bg-white/10">Edit profile</Button>
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
                    <AlertDialogCancel type="button" className="border-white text-black px-6 cursor-pointer">Cancel</AlertDialogCancel>
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
          onClick={() => setTab('badges')}
        >
          Badges
          {tab === 'badges' && (
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
        {tab === "badges" && (
          <div>
            <div className="font-bold text-xl mb-3 text-white">Badges Earned</div>
            <div className="flex gap-4 mt-2 items-center">
              {badgeIcons.map((icon, i) => (
                <span key={i} className="inline-block align-middle">{icon}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;