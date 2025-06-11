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
  AlertDialogCancel,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { toast, Toaster } from "sonner";
import MultiSelect from "@/components/MultiSelect";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/datePickerRange";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { MdGroups, MdSchool, MdStar, MdAccessTime } from 'react-icons/md';

function Profile() {
  const [tab, setTab] = useState("skills");
  const [user, setUser] = useState({});
  const [form, setForm] = useState({
    username: user.username,
    location: user.location,
    bio: user.bio || "",
    skills: user.skills || [],
    learning: user.learning || [],
    availability: user.availability && user.availability.length === 2 ? {
      from: new Date(user.availability[0]),
      to: new Date(user.availability[1])
    } : null
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');

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
        console.error('Error loading skills:', err);
      }
    }
    fetchSkills();
  }, []);

  useEffect(() => {
    fetch('https://countriesnow.space/api/v0.1/countries/positions')
      .then(res => res.json())
      .then(data => {
        setCountries(data.data);
      });
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const localUser = JSON.parse(localStorage.getItem('user'));
      const { data } = await axios.get(`http://localhost:5000/users/profile/${localUser.id}`);
      setUser(data);
      setSelectedCountry(data.location);
      setForm(f => ({
        ...f,
        username: data.username || "",
        location: data.location || "",
        bio: data.bio || "",
        skills: data.skills || [],
        learning: data.learning || [],
        availability: data.availability && data.availability.length === 2 ? {
          from: new Date(data.availability[0]),
          to: new Date(data.availability[1])
        } : null
      }));
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className=" min-h-screen text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading user profile...</p>
    </div>
  );

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
    setSuccess("");
    try {
      const payload = {
        username: form.username,
        location: form.location,
        bio: form.bio,
        skills: form.skills,
        learning: form.learning,
        availability: form.availability?.from && form.availability?.to ? [
          new Date(form.availability.from.getTime() - form.availability.from.getTimezoneOffset() * 60000).toISOString().split("T")[0],
          new Date(form.availability.to.getTime() - form.availability.to.getTimezoneOffset() * 60000).toISOString().split("T")[0]
        ] : []
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
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleCountryChange = (value) => {
    setSelectedCountry(value);
    setForm(f => ({...f, location: value }));
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast.success("Profile URL copied to clipboard!", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    }).catch(() => {
      toast.error("Failed to copy URL", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    });
  };

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
              <AlertDialogTrigger>
                <Button variant="outline" className="border-white cursor-pointer hover:text-white bg-transparent text-white font-semibold rounded-lg px-8 py-2 h-11 text-base transition hover:bg-white/10">Edit profile</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#181f25] text-white border border-gray-700">
                  <AlertDialogHeader>
                  <AlertDialogTitle>Edit Profile</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Update your profile information, skills, and availability.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <Label className="block text-sm mb-1">Username</Label>
                    <Input name="username" value={form.username} onChange={handleChange} className="bg-[#232b32] text-white" />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Country</Label>
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger className="w-full bg-[#232b32] text-white">
                        <SelectValue placeholder={user.location || "Select a country"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#232b32] text-white">
                        {countries.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Bio</Label>
                    <Input name="bio" id="bio" value={form.bio} onChange={handleChange} placeholder="Bio" className="bg-[#232b32] text-white" />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Availability</Label>
                    <DatePickerWithRange
                      className="w-full"
                      selected={form.availability}
                      onSelect={val => setForm(f => ({ ...f, availability: val }))}
                    />
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
                  {success && <div className="text-green-400 text-sm">{success}</div>}
                  <AlertDialogFooter>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    <AlertDialogCancel type="button" className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white px-6 cursor-pointer">Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-8 py-2 h-11 text-base transition" onClick={handleShareProfile}>Share profile</Button>
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
                  <span key={skill} className="rounded-lg px-5 py-2 text-base text-white bg-blue-500/20 font-normal">{skill}</span>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <div className="font-bold text-xl mb-3 text-white">Skills desired</div>
              <div className="flex flex-wrap gap-4">
                {(user.learning && user.learning.length > 0 ? user.learning : ["No learning goals"]).map(skill => (
                  <span key={skill} className="rounded-lg px-5 py-2 text-base text-white bg-purple-500/20 font-normal">{skill}</span>
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
                    <MdGroups className="w-6 h-6 text-green-400" />
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
                    <MdSchool className="w-6 h-6 text-blue-400" />
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
                    <MdStar className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Community Feedback</h3>
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
              {/* Time in Community Stat */}
              <div className="bg-[#181f25] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <MdAccessTime className="w-6 h-6 text-pink-400" />
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