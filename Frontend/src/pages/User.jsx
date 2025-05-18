import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "../components/ui/button";

const badgeIcons = [
  <span key="1" role="img" aria-label="star">⭐</span>,
  <span key="2" role="img" aria-label="rocket">🚀</span>,
  <span key="3" role="img" aria-label="medal">🏅</span>,
];

export default function User() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("skills");
  const [range, setRange] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/users/${id}`)
      .then(res => {
        setUser(res.data);
        setError(null);
        if (res.data.availability && Array.isArray(res.data.availability) && res.data.availability.length === 2) {
          setRange({
            from: new Date(res.data.availability[0]),
            to: new Date(res.data.availability[1])
          });
        } else {
          setRange(null);
        }
      })
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#101820] text-white flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
        <img
          src={user.avatar_url || user.avatar || defaultAvatar}
          alt="avatar"
          className="w-36 h-36 rounded-full border-2 border-white object-cover mb-4 md:mb-0"
        />
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="font-bold text-2xl md:text-2xl text-white">
              {(user.first_name || user.last_name)
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.username
              }
            </div>
            <div className="text-gray-300 text-base mt-1">{user.location || ""}</div>
          </div>
          <div className="bg-white text-black rounded-2xl shadow-lg p-8 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
            <div className="mb-6 text-center text-base font-medium">
              {(user.first_name || user.last_name ? user.first_name || '' : user.username)} wants to learn: <span className="font-bold text-blue-600">{user.learning && user.learning.length > 0 ? user.learning[0] : "a skill"}</span>
              <br />
              <span className="text-gray-600 text-sm">
                Click below to accept and send messages, or decline the request.
              </span>
            </div>
            <div className="flex gap-4 w-full justify-center">
              <Button className="w-1/2 bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition">
                Accept
              </Button>
              <Button variant="outline" className="w-1/2 border-black text-black font-bold py-2 px-8 rounded-lg cursor-pointer transition bg-white hover:bg-gray-100">
                Decline
              </Button>
            </div>
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