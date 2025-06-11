import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast, Toaster } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MdSwapHoriz, MdAdd, MdMessage, MdStar, MdGroups, MdSchool, MdAccessTime } from 'react-icons/md';

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
  const [combineRequest, setCombineRequest] = useState(null);
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [combineMessage, setCombineMessage] = useState("");
  const [hasAcceptedCombineRequest, setHasAcceptedCombineRequest] = useState(false);

  useEffect(() => {
    if (id && currentUser && id === currentUser.id) {
      navigate("/profile", { replace: true });
    }
  }, [id, currentUser, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestIdFromUrl = searchParams.get('requestId');
    const combineFromUrl = searchParams.get('combine');

    if (requestIdFromUrl) {
      setRequestId(requestIdFromUrl);
      setRequestStatus('pending');
      setShowDeclinedMessage(false);

      if (combineFromUrl === 'true') {
        axios.get(`http://localhost:5000/skills/combine-request/${requestIdFromUrl}`)
          .then(response => {
            if (response.data.status === 'pending') {
              setCombineRequest(response.data);
            }
          })
          .catch(error => {
            console.error("Failed to fetch combine request:", error);
            toast.error("Failed to load request details", {
              duration: 3000,
              position: "bottom-center",
              style: {
                background: "#181f25",
                color: "white",
                border: "1px solid #232e39"
              }
            });
          });
      }
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

  useEffect(() => {
    // Check if the combine request has been accepted
    const fetchCombineRequests = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/skills/combine-requests/user/${id}`);
        const combineRequests = response.data;
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const acceptedCombine = combineRequests.find(req =>
          (req.requester_id === currentUser.id || req.receiver_id === currentUser.id) &&
          req.status === 'accepted'
        );
        setHasAcceptedCombineRequest(!!acceptedCombine);
      } catch {
        console.log("No combine requests found");
        setHasAcceptedCombineRequest(false);
      }
    };
    fetchCombineRequests();
  }, [id, location.search]);

  const handleAccept = async () => {
    try {
      const endpoint = location.search.includes('combine=true')
        ? `http://localhost:5000/skills/combine-requests/${requestId}`
        : `http://localhost:5000/skills/skill-requests/${requestId}`;

      await axios.patch(endpoint, { status: 'accepted' });
      if (location.search.includes('combine=true')) {
        setCombineRequest(null);
      } else {
        setRequestStatus(null);
      }
      toast.success("Request accepted successfully!", {
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
      toast.error("Failed to accept request", {
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

  const handleDecline = async () => {
    try {
      const endpoint = location.search.includes('combine=true')
        ? `http://localhost:5000/skills/combine-requests/${requestId}`
        : `http://localhost:5000/skills/skill-requests/${requestId}`;

      await axios.patch(endpoint, { status: 'declined' });
      if (location.search.includes('combine=true')) {
        setCombineRequest(null);
      } else {
        setRequestStatus(null);
      }
      setShowDeclinedMessage(true);
      toast.success("Request declined", {
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

  const handleCombineSkill = () => {
    setShowCombineModal(true);
  };

  const handleSendCombineRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/skills/combine-request`, {
        requester_id: currentUser.id,
        receiver_id: id,
        prompt: combineMessage
      });
      setShowCombineModal(false);
      setCombineMessage("");
      toast.success("Combination request sent successfully!", {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    } catch {
      toast.error("Failed to send combination request", {
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
        <div className="flex-1 flex flex-col md:flex-row  md:justify-between w-full">
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
                  <MdStar key={star} className={star <= Math.round(user.rating || 0) ? "text-yellow-400 text-lg" : "text-gray-500 text-lg"} />
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
          {(combineRequest && combineRequest.status === 'pending' && combineRequest.receiver_id === currentUser.id && location.search.includes('combine=true')) ? (
            <div className="bg-[#181f25] text-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 border border-white/20 mb-6">
              <div className="mb-6 text-center text-base font-medium">
                <span className="text-white font-bold">{user.username}</span> wants to combine skills:
                <br />
                <span className="text-purple-400 font-bold mt-2 block">{combineRequest.prompt}</span>
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
          ) : (requestStatus === 'pending' && requestId && existingRequests.find(
            req => req.id === requestId && req.receiver_id === currentUser.id
          ) && !location.search.includes('combine=true')) ? (
            <div className="bg-[#181f25] text-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 border border-white/20">
              <div className="mb-6 text-center text-base font-medium">
                <span className="text-white font-bold">{user.username}</span> wants to learn: <span className="font-bold text-blue-400">{requestedSkill}</span>
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
          ) : (requestStatus === 'accepted' || hasAcceptedRequest || hasAcceptedCombineRequest) ? (
            <div className=" text-black rounded-2xl justify-center p-8 flex flex-col items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
              <Button
                className="bg-button hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2"
                onClick={() => navigate(`/messages/${user.id}`)}
              >
                <MdMessage className="w-5 h-5" />
                Send Message
              </Button>
            </div>
          ) : (
            <div className=" text-black rounded-2xl  p-8 flex flex-col justify-center items-center max-w-xl w-full md:w-[420px] ml-0 md:ml-8">
              {showDeclinedMessage && (
                <div className="mb-6 text-center text-base font-medium text-white">
                  You declined the request. Would you like to learn a new skill instead?
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2 shadow"
                  onClick={() => setShowSwapModal(true)}
                >
                  <MdSwapHoriz className="w-5 h-5" />
                  Learn from this SkillMate
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg transition flex items-center gap-2 shadow"
                  onClick={handleCombineSkill}
                >
                  <MdAdd className="w-5 h-5" />
                  Combine Skill
                </Button>
              </div>
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
                  <MdGroups className="w-6 h-6 text-green-400" />
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
                      <MdStar key={star} className={star <= Math.round(user.rating || 0) ? "text-yellow-400" : "text-gray-500"} />
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

      <Dialog open={showCombineModal} onOpenChange={setShowCombineModal}>
        <DialogContent className="bg-[#181f25] text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Propose a Skill Combination</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendCombineRequest} className="mt-4">
            <label className="block text-sm font-medium mb-2">Describe your idea for combining skills</label>
            <Textarea
              value={combineMessage}
              onChange={e => setCombineMessage(e.target.value)}
              placeholder="Example: Let's combine your programming with my design to build an app..."
              className="bg-[#232e39] text-white border-gray-700"
              rows={4}
              required
            />
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" className="bg-transparent text-white border border-white cursor-pointer hover:bg-white/10 hover:text-white" onClick={() => setShowCombineModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Send Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right"  />
    </div>
  );
}