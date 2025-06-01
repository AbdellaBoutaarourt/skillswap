import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const getSessionEndDate = (session) => {
  const endTime = session.end_time || session.start_time;
  return new Date(`${session.date}T${endTime}`);
};

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillRequests, setSkillRequests] = useState([]);
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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Fetch sessions
        const { data: sessionsData } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
        const sortedSessions = sessionsData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setSessions(sortedSessions);

        // Fetch skill requests
        const { data: skillRequestsData } = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
        setSkillRequests(skillRequestsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user.id]);

  useEffect(() => {
    const rateSessionId = localStorage.getItem('rateSessionId');
    if (rateSessionId && pastSessions.length > 0) {
      const sessionToRate = pastSessions.find(s => s.id === rateSessionId);
      if (sessionToRate) {
        setMentorId(sessionToRate.mentor_id);
        localStorage.removeItem('rateSessionId');
      }
    }
  }, [pastSessions]);

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
      toast.success('Session accepted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept session');
    }
  };

  const handleDeclineSession = async (sessionId) => {
    try {
      await axios.patch(`http://localhost:5000/sessions/${sessionId}`, { status: 'declined' });
      // Refresh the session list
      const { data } = await axios.get(`http://localhost:5000/sessions/user/${user.id}`);
      const sortedSessions = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(sortedSessions);
      toast.success('Session declined.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to decline session');
    }
  };

  const canJoinSession = () => true;

  const submitRating = async (e) => {
    e.preventDefault();
    await axios.post(`http://localhost:5000/users/${mentorId}/rate`, { rating });
    setRating(0);
    // Optionally, refresh sessions or show a toast here
  };

  const sortedPastSessions = [...pastSessions].sort(
    (a, b) => getSessionEndDate(b) - getSessionEndDate(a)
  );

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
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h1 className="text-3xl font-bold">My Sessions</h1>
        </div>

        {/* Pending Sessions */}
        {pendingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Pending Requests</h2>
            <div className="space-y-4">
              {pendingSessions.map(session => (
                <div key={session.id} className="bg-[#181f25] rounded-lg p-6 hover:bg-[#2a3744] transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-yellow-400">{session.skill_name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-blue-500 text-white px-10 py-1 rounded-lg font-medium"
                        onClick={() => handleAcceptSession(session.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white cursor-pointer text-black rounded-lg font-medium px-10 transition hover:bg-white/10"
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
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-lg">No upcoming sessions.</p>
              <p className="text-gray-500 mt-2">Your scheduled sessions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div key={session.id} className="bg-[#181f25] rounded-lg p-6 hover:bg-[#2a3744] transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-blue-400">{session.skill_name}</h3>
                        {(() => {
                          const skillRequest = skillRequests.find(r => r.id === session.skill_request_id);
                          const isMentor = skillRequest && skillRequest.receiver_id === user.id;
                          return (
                            <div className={`px-3 py-1 rounded-full text-sm ${isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {isMentor ? 'Teaching' : 'Learning'}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{session.mode === 'online' ? 'Online Session' : 'In Person Session'}</span>
                        {session.mode === 'in_person' && session.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {session.mode === 'online' ? (
                      canJoinSession() ? (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          onClick={() => {
                            navigate(`/session/${session.id}`);
                            window.location.reload();
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
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
            <div className="space-y-4">
              {sortedPastSessions.map(session => (
                <div key={session.id} className="bg-[#181f25] rounded-lg p-6 opacity-70">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-400">{session.skill_name}</h3>
                        {(() => {
                          const skillRequest = skillRequests.find(r => r.id === session.skill_request_id);
                          const isMentor = skillRequest && skillRequest.receiver_id === user.id;
                          return (
                            <div className={`px-3 py-1 rounded-full text-sm ${isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {isMentor ? 'Teaching' : 'Learning'}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(session.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{session.mode === 'online' ? 'Online Session' : 'In Person Session'}</span>
                        {session.mode === 'in_person' && session.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{session.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {!session.rated && (() => {
                      const skillRequest = skillRequests.find(r => r.id === session.skill_request_id);
                      const isMentor = skillRequest && skillRequest.receiver_id === user.id;
                      return !isMentor && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                              onClick={() => setMentorId(session.mentor_id)}
                            >
                              Rate Mentor
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#181f25] text-white border-none shadow-2xl">
                            <DialogHeader>
                              <DialogTitle>Rate your mentor</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={submitRating}
                              className="flex flex-col items-center gap-4"
                            >
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
                            </form>
                            <DialogFooter>
                              <Button
                                type="submit"
                                form="rate-form"
                                disabled={rating === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={submitRating}
                              >
                                Submit
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}