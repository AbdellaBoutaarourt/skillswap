import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { toast,Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { MdEventNote, MdLightbulb, MdCalendarToday, MdPerson, MdAccessTime } from 'react-icons/md';

const getSessionEndDate = (session) => {
  const endTime = session.end_time || session.start_time;
  return new Date(`${session.date}T${endTime}`);
};

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillRequests, setSkillRequests] = useState([]);
  const [usersData, setUsersData] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [mentorId, setMentorId] = useState(null);
  const now = new Date();

  const acceptedSessions = sessions.filter(session => session.status === 'accepted');

  const upcomingSessions = acceptedSessions.filter(
    session => getSessionEndDate(session) >= now
  );
  const pastSessions = acceptedSessions.filter(
    session => getSessionEndDate(session) < now
  );

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Fetch sessions
      const { data: sessionsData } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
      // Fetch skill requests
      const { data: skillRequestsData } = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);

      // Get unique user IDs from sessions
      const userIds = new Set();
      sessionsData.forEach(session => {
        userIds.add(session.scheduled_by);
        userIds.add(session.scheduled_with);
      });

      // Fetch user data for all participants
      const usersDataObj = {};
      for (const userId of userIds) {
        const { data: userData } = await axios.get(`http://localhost:5000/users/profile/${userId}`);
        usersDataObj[userId] = userData;
      }
      setUsersData(usersDataObj);

      // Enrich each session with isMentor
      const enrichedSessions = sessionsData.map(session => {
        const skillRequest = skillRequestsData.find(r => r.id === session.skill_request_id);
        const isMentor = skillRequest && skillRequest.receiver_id === user.id;
        return { ...session, isMentor };
      });

      setSessions(enrichedSessions);
      setSkillRequests(skillRequestsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user.id]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleAcceptSession = async (sessionId) => {
    try {
      await axios.patch(`http://localhost:5000/sessions/${sessionId}`, { status: 'accepted' });
      // Refresh the session list
      const { data } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
      const sortedSessions = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(sortedSessions);
      toast.success('Session accepted!', {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeclineSession = async (sessionId) => {
    try {
      await axios.patch(`http://localhost:5000/sessions/${sessionId}`, { status: 'declined' });
      // Refresh the session list
      const { data } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
      const sortedSessions = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(sortedSessions);
      toast.success('Session declined.', {
        duration: 3000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const canJoinSession = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHours, startMinutes] = session.start_time.split(':').map(Number);
    const [endHours, endMinutes] = session.end_time.split(':').map(Number);

    const startTime = new Date(sessionDate);
    startTime.setHours(startHours, startMinutes, 0, 0);

    const endTime = new Date(sessionDate);
    endTime.setHours(endHours, endMinutes, 0, 0);

    const joinTime = new Date(startTime.getTime() - 10 * 60000); // 10 minutes before start

    return now >= joinTime && now <= endTime;
  };

  const submitRating = async (sessionId) => {
    try {
      await axios.post(`http://localhost:5000/users/${mentorId}/rate`, { rating });
      //update session
      await axios.patch(`http://localhost:5000/sessions/${sessionId}/rate`, { rating });
      setRating(0);
      toast.success(`Thank you for rating your mentor ${rating} stars!`, {
        duration: 4000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
      fetchAll();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const sortedPastSessions = [...pastSessions].sort(
    (a, b) => getSessionEndDate(b) - getSessionEndDate(a)
  );

  const hasPendingRating = sortedPastSessions.some(
    session => !session.isMentor && (!session.rated || !session.given_rating)
  );

  // Ajout helper pour détecter une session combine
  const isCombineSession = (session) => !session.skill_request_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111B23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Only the receiver sees the pending request
  const pendingSessions = sessions.filter(
    session =>
      session.status === 'pending' &&
      session.scheduled_with === user.id
  );

  return (
    <div className="p-8 text-white min-h-screen bg-[#111B23]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MdEventNote className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">My Sessions</h1>
        </div>

        {/* Pending Sessions */}
        {pendingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Pending Requests</h2>
            <div className="space-y-4">
              {pendingSessions.map(session => (
                <div key={session.id} className={`bg-[#181f25] rounded-lg p-6 hover:bg-[#2a3744] transition-colors`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {isCombineSession(session) ? (
                          <MdLightbulb className="w-5 h-5 text-purple-400" />
                        ) : (
                          <MdLightbulb className="w-5 h-5 text-yellow-400" />
                        )}
                        <h3 className={`text-xl font-semibold ${isCombineSession(session) ? 'text-purple-300' : 'text-yellow-400'}`}>{session.skill_name || 'Skill Combination'}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm ${isCombineSession(session) ? 'bg-purple-600/20 text-purple-300' : (session.isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400')}`}>
                          {isCombineSession(session) ? 'Combination' : (session.isMentor ? 'Teaching' : 'Learning')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MdCalendarToday className="w-4 h-4" />
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MdPerson className="w-4 h-4" />
                        <span>With: </span>
                        <Link
                          to={`/profile/${session.scheduled_by}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {usersData[session.scheduled_by]?.first_name} {usersData[session.scheduled_by]?.last_name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className={isCombineSession(session) ? 'bg-purple-600 hover:bg-purple-700 text-white px-10 py-1 rounded-lg font-medium' : 'bg-button text-white px-10 py-1 rounded-lg font-medium'}
                        onClick={() => handleAcceptSession(session.id)}
                      >
                        {isCombineSession(session) ? 'Accept Combination' : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white text-white font-bold py-2 px-8 rounded-lg cursor-pointer transition bg-[#181f25] hover:bg-[#232e39] hover:text-white shadow"
                        onClick={() => handleDeclineSession(session.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Sessions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Upcoming Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <div className="bg-[#181f25] rounded-lg p-8 text-center">
              <MdEventNote className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No upcoming sessions.</p>
              <p className="text-gray-500 mt-2">Your scheduled sessions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div key={session.id} className={`bg-[#181f25] rounded-lg p-6 hover:bg-[#2a3744] transition-colors`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {isCombineSession(session) ? (
                          <MdLightbulb className="w-5 h-5 text-purple-400" />
                        ) : (
                          <MdLightbulb className="w-5 h-5 text-yellow-400" />
                        )}
                        <h3 className={`text-xl font-semibold ${isCombineSession(session) ? 'text-purple-300' : 'text-yellow-400'}`}>{session.skill_name || 'Skill Combination'}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm ${isCombineSession(session) ? 'bg-purple-600/20 text-purple-300' : (session.isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400')}`}>
                          {isCombineSession(session) ? 'Combination' : (session.isMentor ? 'Teaching' : 'Learning')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <MdCalendarToday className="w-4 h-4" />
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <MdAccessTime className="w-4 h-4" />
                        <span>{session.mode === 'online' ? 'Online Session' : 'In Person Session'}</span>
                        {session.mode === 'in_person' && session.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <MdPerson className="w-4 h-4" />
                        <span>With: </span>
                        <Link
                          to={`/profile/${session.scheduled_with}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {usersData[session.scheduled_with].first_name} {usersData[session.scheduled_with].last_name}
                        </Link>
                      </div>
                    </div>

                    {session.mode === 'online' ? (
                      canJoinSession(session) ? (
                        <Button
                          className="bg-button hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          onClick={() => {
                            navigate(`/session/${session.id}`);
                            window.location.reload();
                          }}
                        >
                          <MdAccessTime className="w-4 h-4" />
                          Join Session
                        </Button>
                      ) : (
                        <div className="text-xs text-yellow-400 mt-2">
                          You can join 10 minutes before the session starts.
                        </div>
                      )
                    ) : (
                      session.location && (
                        <div className="text-xs text-blue-400 mt-2">
                          Location: {session.location}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        {sortedPastSessions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-400">Past Sessions</h2>
            {hasPendingRating && (
              <div className="mb-4 p-4 bg-[#232e39] border-l-4 border-blue-500 text-blue-300 rounded">
                You have past sessions that you haven&apos;t rated yet. Please consider leaving feedback for your mentor!
              </div>
            )}
            <div className="space-y-4">
              {sortedPastSessions.map(session => (
                <div key={session.id} className={`bg-[#181f25] rounded-lg p-6 opacity-70`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {isCombineSession(session) ? (
                          <MdLightbulb className="w-5 h-5 text-purple-400" />
                        ) : (
                          <MdLightbulb className="w-5 h-5 text-gray-400" />
                        )}
                        <h3 className={`text-xl font-semibold ${isCombineSession(session) ? 'text-purple-300' : 'text-gray-400'}`}>{session.skill_name || 'Skill Combination'}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm ${isCombineSession(session) ? 'bg-purple-600/20 text-purple-300' : (session.isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400')}`}>
                          {isCombineSession(session) ? 'Combination' : (session.isMentor ? 'Teaching' : 'Learning')}
                        </div>

                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MdCalendarToday className="w-4 h-4" />
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MdAccessTime className="w-4 h-4" />
                        <span>{session.mode === 'online' ? 'Online Session' : 'In Person Session'}</span>
                        {session.mode === 'in_person' && session.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MdPerson className="w-4 h-4" />
                        <span>With: </span>
                        <Link
                          to={`/profile/${session.scheduled_with}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {usersData[session.scheduled_with]?.first_name} {usersData[session.scheduled_with]?.last_name}
                        </Link>
                      </div>
                    </div>
                    {session.rated && session.given_rating ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(star => (
                            <span
                              key={star}
                              className={star <= session.given_rating ? 'text-yellow-400 text-2xl' : 'text-gray-400 text-2xl'}
                            >★</span>
                          ))}
                        </div>
                        <span className="text-xs mt-1 text-gray-400 italic">
                          {session.isMentor ? "You have been rated" : "Rating submitted"}
                        </span>
                      </div>
                    ) : (
                      !session.isMentor && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-white hover:bg-transparent hover:text-white text-black border border-white px-6 py-2 rounded-lg font-medium transition-colors"
                              onClick={() => {
                                setMentorId(
                                  skillRequests.find(r => r.id === session.skill_request_id)?.receiver_id
                                );
                              }}
                            >
                              Rate Mentor
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#181f25] text-white border-none shadow-2xl">
                            <DialogHeader>
                              <DialogTitle>Rate your mentor</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex gap-2 justify-center my-4">
                                {[1,2,3,4,5].map(star => (
                                  <Button
                                    key={star}
                                    type="button"
                                    variant="ghost"
                                    className="text-3xl cursor-pointer"
                                    onClick={() => setRating(star)}
                                  >
                                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  className="w-full bg-button hover:bg-blue-700 text-white"
                                  onClick={() => submitRating(session.id)}
                                  disabled={rating === 0}
                                >
                                  Submit
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}