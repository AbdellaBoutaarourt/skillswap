import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { DatePickerWithRange } from "../components/datePickerRange";
import defaultAvatar from "../assets/user.png";
import axios from "axios";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { toast, Toaster } from "sonner"
import { Link } from "react-router-dom";

export default function Explore() {
  const [categories, setCategories] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [existingRequests, setExistingRequests] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/skills');
      setSkillsData(data);
      setCategories([...new Set(data.map(skill => skill.category))]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/users/explore');
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filteredUsers = [...allUsers];

    if (selectedCategories.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        const userSkills = user.skills || [];
        return selectedCategories.some(category => {
          const categorySkills = skillsData
            .filter(skill => skill.category === category)
            .map(skill => skill.name);
          return userSkills.some(skill => categorySkills.includes(skill));
        });
      });
    }

    if (dateRange && dateRange.from && dateRange.to) {
      filteredUsers = filteredUsers.filter(user => {
        if (!user.availability || !Array.isArray(user.availability) || user.availability.length !== 2) return false;

        const [userStartDate, userEndDate] = user.availability.map(date => new Date(date));
        const filterStartDate = new Date(dateRange.from);
        const filterEndDate = new Date(dateRange.to);

        return (
          (userStartDate <= filterEndDate && userEndDate >= filterStartDate) ||
          (filterStartDate <= userEndDate && filterEndDate >= userStartDate)
        );
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      filteredUsers = filteredUsers.filter(user => {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        return (
        (user.name && user.name.toLowerCase().includes(query)) ||
          (user.location && user.location.toLowerCase().includes(query)) ||
          fullName.includes(query) ||
          (Array.isArray(user.skills) && user.skills.some(skill => skill?.toLowerCase().includes(query)))
      );
      });
    }

    setUsers(filteredUsers);
  }, [allUsers, selectedCategories, dateRange, searchQuery, skillsData]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      setExistingRequests([]);
      return;
    }
    axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`)
      .then(res => setExistingRequests(res.data))
      .catch(() => setExistingRequests([]));
  }, []);

  const handleSwapRequest = async (receiver_id, requested_skill, receiver_name) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const requester_id = user && user.id;
    if (!requester_id) {
      toast("Error", {
        description: "You must be logged in to send a swap request.",
        duration: 2000,
        variant: "destructive",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    try {
      await axios.post('http://localhost:5000/skills/skill-requests', {
        requester_id,
        receiver_id,
        requested_skill,
      });
      toast("Request sent!", {
        description: `Your swap request for ${requested_skill} has been sent to ${receiver_name}.`,
        duration: 4000,
        variant: "success",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      const response = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
      setExistingRequests(response.data);
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch {
      toast("Error", {
        description: "Failed to send swap request.",
        duration: 4000,
        variant: "destructive",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser ? currentUser.id : null;

  return (
    <div className="flex min-h-screen bg-[#111B23] text-white">
      {/* Mobile/Tablet Filters Button */}

      <aside className="w-64 p-6 border-r border-gray-800 hidden md:block">
        <h3 className="font-bold mb-4">Filters</h3>
        <div className="mb-6">
          <span className="block text-sm mb-2">Availability</span>
          <DatePickerWithRange onSelect={setDateRange} />
        </div>
        <div className="mb-6">
          <span className="block text-sm mb-2">Skills Categories</span>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => {
                    setSelectedCategories(prev => {
                      const alreadySelected = prev.includes(cat);
                      if (alreadySelected) {
                        //remove the category if it is already selected
                        return prev.filter(c => c !== cat);
                      } else {
                        //add the category if it is not already selected
                        return [...prev, cat];
                      }
                    });
                  }}
                  className="accent-blue-500"
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 md:px-4">
        <h1 className="text-3xl font-bold mb-6">Discover new skills and talented users</h1>
        <div className="mb-8 flex items-center gap-2">
          <Input
            placeholder="search for a skill, location or user"
            className="w-full max-w-xl text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="md:hidden flex justify-end">
        <Button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2  text-white font-semibold rounded-lg px-5 py-2 shadow-lg   transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z"/>
          </svg>
          Filters
        </Button>
      </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Top members</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
              const alreadyRequested = existingRequests.some(
                req =>
                  req.requester_id === currentUserId &&
                  req.receiver_id === user.id &&
                  req.requested_skill === selectedSkill &&
                  req.status !== 'declined'
              );
              return (
                <div key={user.id} className="flex flex-col sm:flex-row items-start gap-2 p-4 bg-[#181f25] rounded-xl shadow-xl border-none h-full w-full max-w-xs sm:max-w-none mx-auto">
                  <img src={user.avatar || defaultAvatar}  alt={user.name} className="w-15 h-15 rounded-full border-2 border-button object-cover mx-auto sm:mx-0" />
                  <div className="flex-1 w-full min-w-0 h-full flex flex-col justify-between">
                    <div>
                    <Link to={`/profile/${user.id}`} className="font-bold text-lg text-white hover:text-blue-400 transition-colors">
                      {user.name}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <span role="img" aria-label="bio">📖</span>
                      {user.bio && user.bio.length > 0
                        ? user.bio.length > 100
                          ? user.bio.slice(0, 100) + '...'
                          : user.bio
                        : <span className="italic text-gray-500">No bio</span>
                      }
                    </div>
                    <div className="flex items-left flex-col mb-3">
                      <div className="flex">
                        <span className="text-yellow-400 font-bold">
                          {user.rating ? user.rating.toFixed(1) : ""}
                        </span>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={star <= Math.round(user.rating) ? "text-yellow-400" : "text-gray-500"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        ({user.reviews || 0} reviews)
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-white mb-1">🔁 I offer :</div>
                      <div className="flex flex-wrap gap-1">
                        {user.skills?.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-white rounded-lg text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs text-white mb-1">🎯 I want to learn :</div>
                      <div className="flex flex-wrap gap-1">
                        {user.learning?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-500/20 text-white rounded-lg text-xs  md:w-auto">
                            {skill}
                          </span>
                        ))}
                      </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      {user.id !== currentUserId && (
                      <Dialog open={openDialog && selectedUser?.id === user.id} onOpenChange={open => { setOpenDialog(open); if (!open) setSelectedSkill(""); }}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setSelectedUser(user); setSelectedSkill(""); }}>Send Swap Request !</Button>
                        </DialogTrigger>
                          <DialogContent className="bg-[#111B23] text-white border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl font-bold">Send a Swap Request</DialogTitle>
                              <div className=" text-gray-500 font-semibold text-base md:text-sm">
                                Choose the skill you want to learn from {user.name}
                            </div>
                          </DialogHeader>
                          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                            <SelectTrigger className="w-full bg-[#181f25] border-gray-700">
                              <SelectValue placeholder="Select a skill..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#181f25] border-gray-700">
                              {user.skills?.map((skill, idx) => (
                                <SelectItem key={idx} value={skill} className="text-white hover:bg-[#2194F2]">{skill}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <DialogFooter className="mt-4">
                            <Button
                              disabled={!selectedSkill || alreadyRequested}
                              onClick={() => {
                                setOpenDialog(false);
                                handleSwapRequest(user.id, selectedSkill, user.name);
                              }}
                              className="w-full"
                            >
                              {alreadyRequested ? "Already requested" : "Confirm"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-center mt-8">
          <Button>More users</Button>
        </div>
      </main>
      <Toaster position="bottom-right"  />
      {/* Mobile/Tablet Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="bg-[#181f25] text-white max-w-xs w-full">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div>
            <span className="block text-sm mb-2">Availability</span>
            <DatePickerWithRange onSelect={setDateRange} />
          </div>
          <div className="mb-6">
            <span className="block text-sm mb-2">Skills Categories</span>
            <div className="flex flex-col gap-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => {
                      setSelectedCategories(prev =>
                        prev.includes(cat)
                          ? prev.filter(c => c !== cat)
                          : [...prev, cat]
                      );
                    }}
                    className="accent-blue-500"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}