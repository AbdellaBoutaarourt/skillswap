import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast, Toaster } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";

const badgeIcons = [
  <span key="1" role="img" aria-label="star">⭐</span>,
  <span key="2" role="img" aria-label="rocket">🚀</span>,
  <span key="3" role="img" aria-label="medal">🏅</span>,
];

export default function User() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("skills");
  const [range, setRange] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [requestedSkill, setRequestedSkill] = useState(null);
  const [showDeclinedMessage, setShowDeclinedMessage] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestIdFromUrl = searchParams.get('requestId');
    if (requestIdFromUrl) {
      setRequestId(requestIdFromUrl);
      setRequestStatus('pending');
      setShowDeclinedMessage(false);
    }
  }, [location.search]);



  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/skills/skill-requests/user/${id}`);
        const requests = response.data;

        const searchParams = new URLSearchParams(location.search);
        const requestIdFromUrl = searchParams.get('requestId');

        if (requestIdFromUrl) {
          const specificRequest = requests.find(req => req.id === requestIdFromUrl);
          if (specificRequest) {
            setRequestId(specificRequest.id);
            setRequestedSkill(specificRequest.requested_skill);
            setRequestStatus(specificRequest.status);
          }
        } else {
          const latestRequest = requests[0];
          if (latestRequest) {
            setRequestId(latestRequest.id);
            setRequestedSkill(latestRequest.requested_skill);
            setRequestStatus(latestRequest.status);
          }
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    if (id) {
      fetchRequests();
    }
  }, [id, location.search]);

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

  const handleAccept = async () => {
    try {
      await axios.post(`http://localhost:5000/requests/accept/${requestId}`);
      setRequestStatus('accepted');
      toast.success("You can now start messaging with this user.");
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || "Failed to accept request. Please try again.");
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(`http://localhost:5000/requests/decline/${requestId}`);
      setRequestStatus('declined');
      setShowDeclinedMessage(true);
      toast.success("You can propose a skill swap instead.");
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error(error.response?.data?.message || "Failed to decline request. Please try again.");
    }
  };

  const handleSwapSkill = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const requester_id = user.id;

    if (!selectedSkill) {
      toast.error("Please select a skill to learn");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/skills/skill-requests`, {
        requester_id,
        receiver_id: id,
        requested_skill: selectedSkill,
      });
      setShowSwapModal(false);
      toast.success("The user will be notified of your swap proposal.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send swap request. Please try again.");
    }
  };

  if (loading) return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading user profile...</p>
    </div>
  );
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-12 mx-5">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:space-x-8 mb-8">
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
          {requestStatus === 'pending' && (
            <div className="bg-white text-black rounded-2xl shadow-lg px-8 py-4 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0">
              <div className="mb-6 text-center text-base font-medium">
                {(user.first_name || user.last_name ? user.first_name || '' : user.username)} wants to learn: <span className="font-bold text-blue-600">{requestedSkill}</span>
                <br />
                <span className="text-gray-600 text-sm">
                  Click below to accept or decline the request.
                </span>
              </div>
              <div className="flex gap-4 w-full justify-center">
                <Button className="w-1/2 bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition" onClick={handleAccept}>
                  Accept
                </Button>
                <Button variant="outline" className="w-1/2 border-black text-black font-bold py-2 px-8 rounded-lg cursor-pointer transition bg-white hover:bg-gray-100" onClick={handleDecline}>
                  Decline
                </Button>
              </div>
            </div>
          )}
          {showDeclinedMessage && (
            <div className=" text-black rounded-2xl  px-8 py-4 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 ">
              <div className="mb-6 text-center text-base font-medium text-white">
                You declined the request. Would you like to propose a skill swap instead?
              </div>
              <div className="flex gap-4 w-full justify-center">
                <Button className="w-1/2 bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition" onClick={() => setShowSwapModal(true)}>
                  Swap Skills
                </Button>
              </div>
            </div>
          )}
          {requestStatus === 'accepted' && (
            <div className=" text-black rounded-2xl  p-8 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
              <Button
                className="bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2"
                onClick={() => navigate(`/messages/${user.id}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Message
              </Button>
            </div>
          )}
          {!requestStatus && (
            <div className="text-black rounded-2xl p-8 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
              <Button
                className="bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2"
                onClick={() => setShowSwapModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Propose Skill Swap
              </Button>
            </div>
          )}
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

      <Dialog open={showSwapModal} onOpenChange={setShowSwapModal}>
        <DialogContent className="bg-[#181f25] text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Select a skill to learn</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Select onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {user.skills && user.skills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => setShowSwapModal(false)}>
              Cancel
            </Button>
            <Button className="bg-button hover:bg-blue-700" onClick={handleSwapSkill}>
              Propose Swap
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right"  />
    </div>
  );
}