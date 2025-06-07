import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast, Toaster } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";

export default function User() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("skills");
  const [range, setRange] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [requestedSkill, setRequestedSkill] = useState(null);
  const [showDeclinedMessage, setShowDeclinedMessage] = useState(false);
  const [hasAcceptedRequest, setHasAcceptedRequest] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));

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
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) return;

        const response = await axios.get(`http://localhost:5000/skills/skill-requests/user/${id}`);
        const requests = response.data;

        const searchParams = new URLSearchParams(location.search);
        const requestIdFromUrl = searchParams.get('requestId');
        setExistingRequests(requests);

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

        // Check if there's an accepted request between users
        const acceptedRequest = requests.find(req =>
          (req.requester_id === currentUser.id || req.receiver_id === currentUser.id) &&
          req.status === 'accepted'
        );
        setHasAcceptedRequest(acceptedRequest);

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
    axios.get(`http://localhost:5000/users/profile/${id}`)
      .then(res => {
        setUser(res.data);
        if (res.data.availability && Array.isArray(res.data.availability) && res.data.availability.length === 2) {
          setRange({
            from: new Date(res.data.availability[0]),
            to: new Date(res.data.availability[1])
          });
        } else {
          setRange(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);


  const handleAccept = async () => {
    try {
      await axios.post(`http://localhost:5000/requests/accept/${requestId}`);
      setRequestStatus('accepted');
      toast.success("You can now start messaging with this user.", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(`http://localhost:5000/requests/decline/${requestId}`);
      setRequestStatus('declined');
      setShowDeclinedMessage(true);
      toast.success("You can propose a skill swap instead.", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleSwapSkill = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const requester_id = user.id;


    const currentUser = JSON.parse(localStorage.getItem("user"));
    const alreadyRequested = existingRequests.some(
      req =>
        req.requester_id === currentUser.id &&
        req.receiver_id === user.id &&
        req.requested_skill === selectedSkill &&
        req.status !== 'declined'
    );

    if (alreadyRequested) {
      toast.error("You have already requested this skill.");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/skills/skill-requests`, {
        requester_id,
        receiver_id: id,
        requested_skill: selectedSkill,
      });
      setShowSwapModal(false);
      toast.success("The user will be notified of your swap proposal.", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message, {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading user profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-12 mx-5">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
        <img
          src={user.avatar_url || defaultAvatar}
          alt="avatar"
          className="w-36 h-36 rounded-full border-4 border-blue-500 object-cover mb-4 md:mb-0 shadow-lg"
        />
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="font-bold text-2xl md:text-2xl text-white">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-blue-400 text-base mt-1 font-semibold">
              @{user.username}
            </div>
            <div className="text-gray-400 text-base mt-1">{user.location}</div>
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
          {requestStatus === 'pending' && requestId && existingRequests.find(
            req => req.id === requestId && req.receiver_id === currentUser.id
          ) && (
            <div className="bg-[#181f25] text-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 border border-white/20">
              <div className="mb-6 text-center text-base font-medium">
                <span className="text-white font-bold">{ user.username}</span> wants to learn: <span className="font-bold text-blue-400">{requestedSkill}</span>
                <br />
                <span className="text-gray-400 text-sm">
                  Click below to accept or decline the request.
                </span>
              </div>
              <div className="flex gap-4 w-full justify-center">
                <Button className="w-1/2 bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition" onClick={handleAccept}>
                  Accept
                </Button>
                <Button variant="outline" className="w-1/2 border-white text-white font-bold py-2 px-8 rounded-lg cursor-pointer transition bg-[#181f25] hover:bg-[#232e39] hover:text-white shadow" onClick={handleDecline}>
                  Decline
                </Button>
              </div>
            </div>
          )}
          {!hasAcceptedRequest && (
            <div className=" text-black rounded-2xl  p-8 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
          {showDeclinedMessage && (
              <div className="mb-6 text-center text-base font-medium text-white">
                  You declined the request. Would you like to learn a new skill instead?
              </div>
              )}
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2 shadow"
                onClick={() => setShowSwapModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Learn from this SkillMate
                </Button>
            </div>
          )}
          {(requestStatus === 'accepted' || (hasAcceptedRequest && requestStatus !== 'pending')) && (
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
        </div>
      </div>
      <div className="w-full max-w-4xl mb-8">
        <div className="font-bold text-xl mb-2 text-white">About</div>
        <div className="text-white text-base leading-snug">{user.bio || "No bio provided."}</div>
      </div>
      <div className="w-full max-w-4xl flex justify-between border-b border-[#232e39] mb-8">
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('skills')}
        >
          Skills
          {tab === 'skills' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-lg transition-all duration-300" />
          )}
        </button>
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('availability')}
        >
          Availability
          {tab === 'availability' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-lg transition-all duration-300" />
          )}
        </button>
        <button
          className={`flex-1 text-center py-2 font-bold text-xl transition border-b-0 cursor-pointer relative text-white`}
          onClick={() => setTab('stats')}
        >
        Stats
          {tab === 'stats' && (
            <span className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-24 h-[2.5px] bg-white rounded-lg transition-all duration-300" />
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
            <div className="bg-[#181f25] rounded-lg p-4 w-full max-w-2xl mx-auto flex justify-center">
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
            <div className="font-bold text-xl mb-3 text-white"> SkillSwap Stats</div>
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

                <p className="text-2xl font-bold text-white mt-2">{user.teaching_sessions?.length || 0} </p>
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
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Time in Community</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Member since ({new Date(user.created_at).toLocaleDateString('en-US', {month: 'long', year: 'numeric' }) })</p>
                <p className="text-2xl font-bold text-white mt-2">{Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} Days</p>
                <p className="text-xs text-gray-400 mt-1">days in the community</p>
              </div>
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
            <Button variant="outline" className="bg-transparent text-white border border-white cursor-pointer hover:bg-white/10 hover:text-white" onClick={() => setShowSwapModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedSkill || existingRequests.some(
                req =>
                  req.requester_id === JSON.parse(localStorage.getItem("user")).id &&
                  req.receiver_id === id &&
                  req.requested_skill === selectedSkill &&
                  req.status !== 'declined'
              )}
              onClick={() => {
                setShowSwapModal(false);
                handleSwapSkill();
              }}
              className="bg-button hover:bg-blue-700"
            >
              {existingRequests.some(
                req =>
                  req.requester_id === JSON.parse(localStorage.getItem("user")).id &&
                  req.receiver_id === id &&
                  req.requested_skill === selectedSkill &&
                  req.status !== 'declined'
              ) ? "Already requested" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right"  />
    </div>
  );
}