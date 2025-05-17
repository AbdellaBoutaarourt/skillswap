import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { DatePickerWithRange } from "../components/datePickerRange";
import axios from "axios";

export default function Explore() {
  const [categories, setCategories] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
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
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    setUsers(filteredUsers);
  }, [allUsers, selectedCategories, dateRange, searchQuery, skillsData]);

  return (
    <div className="flex min-h-screen bg-[#111B23] text-white">
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
      </aside>
      <main className="flex-1 p-6 md:p-12">
        <h1 className="text-3xl font-bold mb-6">Discover new skills and talented users</h1>
        <div className="mb-8">
          <Input
            placeholder="search for a skill, location or user"
            className="w-full max-w-xl text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <h2 className="text-2xl font-semibold mb-4">Top members</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
            <Button
              onClick={fetchUsers}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-[#181f25] rounded-xl shadow border-none">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-2 border-button" />
                <div className="flex-1">
                  <div className="font-bold text-lg">{user.name}</div>
                  <div className="text-gray-300 text-sm mb-2">{user.role}</div>
                  <div className="text-xs text-gray-400 mb-2">{user.rating}.0 ({user.reviews} reviews)</div>
                  <Button>connect →</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center mt-8">
          <Button>More users</Button>
        </div>
      </main>
    </div>
  );
}