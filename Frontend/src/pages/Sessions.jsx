import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
      setSessions(data);
    };
    fetchSessions();
  }, [user.id]);

  return (
    <div className="p-8 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">My Sessions</h1>
      <div className="space-y-4">
        {sessions.filter(session => session.status === 'accepted').length === 0 && <div>No accepted sessions yet.</div>}
        {sessions.filter(session => session.status === 'accepted').map(session => (
          <div key={session.id} className="bg-[#232e39] rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{session.skill_name}</div>
              <div className="text-sm text-gray-400">
                {session.date} {session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}
              </div>
              <div className="text-sm">{session.status}</div>
            </div>
            <Button
              className="bg-blue-500 text-white"
              onClick={() => navigate(`/session/${session.id}`)}
            >
              Join session
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}