import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DatePickerWithRange } from "@/components/datePickerRange";




export default function Explore() {
  const categories = ["Design", "Development", "Music", "Video", "Cooking", "Sport"];
  const users = [
    { name: "John Doe", role: "Full-stack developer", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=John", rating: 5, reviews: 20 },
    { name: "Elin Smith", role: "Front-end developer", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Elin", rating: 5, reviews: 20 },
    { name: "Mounir Moons", role: "Front-end developer", avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Mounir", rating: 5, reviews: 20 },
  ];

  const [selectedCategories, setSelectedCategories] = useState([categories[0]]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

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
                <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => {
                  setSelectedCategories(selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat]);
                }} className="accent-blue-500" />
                <span>{cat}</span>
              </label>
            ))}
          </div>
          <Button className="mt-2">More</Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-12">
        <h1 className="text-3xl font-bold mb-6">Discover new skills and talented users</h1>
        <div className="mb-8">
          <Input placeholder="search for a skill, location or user" className="w-full max-w-xl text-white" />
        </div>
        <h2 className="text-2xl font-semibold mb-4">Top members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.name} className="flex items-center gap-4 p-4 bg-[#181f25] rounded-xl shadow border-none">
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
        <div className="flex justify-center mt-8">
          <Button>More users</Button>
        </div>
      </main>
    </div>
  );
}