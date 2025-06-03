import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import SimplePeer from "simple-peer/";
import socket from "../socket";
import axios from "axios";
import dayjs from "dayjs";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../components/ui/dialog";
import { toast } from "sonner";

export default function JoinSession() {
  const { sessionId } = useParams();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const navigate = useNavigate();
  const offerReceived = useRef(false);
  const answerReceived = useRef(false);
  const peerDisconnected = useRef(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const [skillRequest, setSkillRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const toggleMute = () => {
      if (peerRef.current) {
        peerRef.current.streams[0].getAudioTracks()[0].enabled = isMuted;
      }
      setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        const sender = peerRef.current._pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
           sender.replaceTrack(videoTrack)
          } ;
      }
    }
    setIsCameraOff(!isCameraOff);

  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (localVideo.current) localVideo.current.srcObject = screenStream;
      setIsScreenSharing(true);


      if (peerRef.current && streamRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current._pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }

      // when the user stops screen sharing
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const stopScreenShare = async () => {
    //
    if (streamRef.current && localVideo.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      localVideo.current.srcObject = streamRef.current;
      setIsScreenSharing(false);
      if (peerRef.current) {
        const sender = peerRef.current._pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }
    }
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        // Get session info
        const { data: session } = await axios.get(`http://localhost:5000/sessions/${sessionId}`);
        setSessionInfo(session);

        // Get skill request
        const { data: skillRequests } = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
        const req = skillRequests.find(r => r.id === session.skill_request_id);
        setSkillRequest(req);

        // Get participants
        const [userA, userB] = await Promise.all([
          axios.get(`http://localhost:5000/users/profile/${session.scheduled_by}`),
          axios.get(`http://localhost:5000/users/profile/${session.scheduled_with}`)
        ]);

        // Assign roles based on receiver_id in skillRequest
        const participantsArr = [
          {
            id: userA.data.id,
            name: `${userA.data.first_name} ${userA.data.last_name}`,
            role: req ? (userA.data.id === req.receiver_id ? 'Mentor' : 'Learner') : null
          },
          {
            id: userB.data.id,
            name: `${userB.data.first_name} ${userB.data.last_name}`,
            role: req ? (userB.data.id === req.receiver_id ? 'Mentor' : 'Learner') : null
          }
        ];
        setParticipants(participantsArr);
      } catch (error) {
        console.error("Error fetching session or participants info:", error);
      }
    }
    fetchAll();
  }, [sessionId, user.id]);

  const isMentor = skillRequest && skillRequest.receiver_id === user.id;

  const leaveSession = () => {
    // Destroy the Peer connection
    peerRef.current?.destroy();
    peerRef.current = null;

    // Clean socket
    if (socketRef.current) {
      socketRef.current.emit("leave-session", sessionId);
      ["peer-joined", "signal", "users-in-session", "peer-disconnected"].forEach(event =>
        socketRef.current.off(event)
      );
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    //local stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    //State
    setCallEnded(true);
    setCallAccepted(false);
    offerReceived.current = false;
    answerReceived.current = false;
    peerDisconnected.current = false;

    // Check if we need to show rating dialog
    if (!isMentor && !sessionInfo.rated) {
      setShowRatingDialog(true);
    } else {
      // Redirection
      localStorage.setItem('rateSessionId', sessionId);
      navigate("/sessions");
    }
  };

  const handleRatingSubmit = async () => {
    try {
      await axios.post(`http://localhost:5000/users/${sessionInfo.scheduled_by}/rate`, { rating });
      await axios.patch(`http://localhost:5000/sessions/${sessionId}/rate`, { rating });
      setShowRatingDialog(false);
      // Redirection
      localStorage.setItem('rateSessionId', sessionId);
      navigate("/sessions");
      toast.success(`Thank you for rating your mentor ${rating} stars!`, {
        duration: 4000,
        position: "bottom-center",
        style: {
          background: "#181f25",
          color: "white",
          border: "1px solid #232e39"
        }
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  useEffect(() => {
    async function init() {
      setCallAccepted(false);
      setCallEnded(false);
      offerReceived.current = false;
      answerReceived.current = false;
      peerDisconnected.current = false;

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;

      socketRef.current = socket;
      socketRef.current.emit("join-session", sessionId);

      // If you are the second to join, you are the initiator
      socketRef.current.on("peer-joined", () => {
        if (peerRef.current) {
          return;
        }

        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: stream,
        });
        peerRef.current = peer;

        peer.on("signal", data => {
          socketRef.current.emit("signal", { sessionId, data });
        });

        peer.on("stream", remoteStream => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
          setCallAccepted(true);
          setCallEnded(false);
        });

        // Add connection state monitoring
        peer.on("close", () => {
          setCallAccepted(false);
          setCallEnded(true);
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
        });
      });

      // Listen for signaling data
      socketRef.current.on("signal", signal => {
        if (!peerRef.current) {
          // First user: create peer as non-initiator
          const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
          });
          peerRef.current = peer;

          peer.on("signal", data => {
            socketRef.current.emit("signal", { sessionId, data });
          });

          peer.on("stream", remoteStream => {
            if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
            setCallAccepted(true);
            setCallEnded(false);
          });

          // Add connection state monitoring
          peer.on("close", () => {
            setCallAccepted(false);
            setCallEnded(true);
            if (peerRef.current) {
              peerRef.current.destroy();
              peerRef.current = null;
            }
          });

          try {
            peer.signal(signal);
            offerReceived.current = true;
          } catch (err) {
            console.error("Error signaling initial signal:", err);
          }
        } else {
          // Existing peer: forward signal, ignore duplicates
          if (signal.type === "offer" && offerReceived.current) {
            return;
          }
          if (signal.type === "offer") {
            offerReceived.current = true;
          }
          if (signal.type === "answer" && answerReceived.current) {
            return;
          }
          if (signal.type === "answer") {
            answerReceived.current = true;
          }
          if (peerRef.current && !peerRef.current.destroyed) {
            try {
              peerRef.current.signal(signal);
            } catch (err) {
              console.error("Error signaling existing peer:", err);
            }
          }
        }
      });

      socketRef.current.on("peer-disconnected", () => {
        if (peerDisconnected.current) {
          return;
        }
        peerDisconnected.current = true;

        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = null;
        }
        setCallAccepted(false);
        setCallEnded(true);
      });
    }

    init();


  }, [sessionId]);

  // Socket chat logic
  useEffect(() => {
    if (!socketRef.current) return;
    const handleMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          self: msg.user === user.username
        }
      ]);
      if (!showChat) setHasUnreadChat(true);
    };
    socketRef.current.on("chat-message", handleMessage);
    return () => {
      socketRef.current?.off("chat-message", handleMessage);
    };
  }, [showChat, user.username]);

  useEffect(() => {
    if (showChat) setHasUnreadChat(false);
  }, [showChat]);

  const sendMessage = (e) => {
    e.preventDefault();
    const msg = {
      user: user.username,
      text: chatInput,
      avatar: user.avatar,
      time: dayjs().format("HH:mm"),
    };
    socketRef.current.emit("chat-message", { sessionId, ...msg });
    setChatInput("");
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // refresh local video stream on fullscreen toggle to avoid black camera
  useEffect(() => {
    if (!isCameraOff &&localVideo.current && streamRef.current) {
      localVideo.current.srcObject = streamRef.current;
    }
  }, [isFullScreen,isCameraOff]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dayjs().isAfter(dayjs(sessionInfo.end_time))) {
        alert("You have exceeded the scheduled end time of the session!");
        clearInterval(interval);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionInfo]);

  return (
    <div className={`main flex flex-col md:flex-row min-h-screen bg-[#111B23] text-white${isFullScreen ? ' fullscreen-active' : ''}`}>
      {/* Main video area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 min-h-0">
        <div className="w-full flex-1  flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold">Skill Swap Session</h1>
                {sessionInfo && (
                  <div className="text-xs text-gray-400 flex gap-4 mt-2">
                    <span>
                      Start: {sessionInfo.start_time.slice(0, 5)}
                    </span>
                    <span>
                      End: {sessionInfo.end_time.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              onClick={leaveSession}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Leave Session
            </Button>
          </div>

          <div className={`relative ${isFullScreen ? 'flex flex-row gap-0 mb-0 h-[80vh]' : 'grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'}`}>
            {/* Remote video (partenaire) */}
            <div className={`bg-[#181f25] rounded-lg ${isFullScreen ? 'flex-1 p-0 h-full flex items-center justify-center relative' : 'p-4'}`}
              style={isFullScreen ? { minHeight: 0 } : {}}>
              {/* Overlay nom du partenaire en plein écran */}
              {isFullScreen && (
                <div className="absolute top-4 left-4 z-50 bg-black/60 text-white text-lg font-semibold px-4 py-2 rounded shadow">
                  {participants.length > 0 && participants.find(p => p.id !== user.id)?.name}
                </div>
              )}
              {!isFullScreen && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-lg font-semibold">
                      {participants.length > 0 && participants.find(p => p.id !== user.id)?.name}
                    </h2>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${!isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {!isMentor ? 'Mentor' : 'Learner'}
                  </div>
                </div>
              )}
                <video
                  ref={remoteVideo}
                  autoPlay
                  playsInline
                  className={`bg-black rounded-lg ${isFullScreen ? 'w-full h-full object-contain' : 'w-full aspect-video'}`}
                  style={isFullScreen ? { minHeight: 0, maxHeight: '100%' } : {}}
                />
            </div>
            {/* Local video (You) */}
            {isFullScreen ? (
              <div className="absolute bottom-6 right-6 z-40 w-64 max-w-[30vw]">
                {isCameraOff ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="7" width="15" height="10" rx="2" ry="2" strokeWidth="2" />
                      <path d="M21 7v10l-4-4" strokeWidth="2" />
                      <line x1="4" y1="4" x2="20" y2="20" stroke="red" strokeWidth="2" />
                    </svg>
                  </div>
                ) : (
                  <video
                    ref={localVideo}
                    autoPlay
                    muted
                    playsInline
                    className="rounded-lg bg-black shadow-lg w-full aspect-video border-4 border-white"
                    style={{ minWidth: 0 }}
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  You
                </div>
              </div>
            ) : (
              <div className="bg-[#181f25] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-lg font-semibold">You</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm ${isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {isMentor ? 'Mentor' : 'Learner'}
                    </div>
                  </div>
                </div>
                {isCameraOff ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="7" width="15" height="10" rx="2" ry="2" strokeWidth="2" />
                      <path d="M21 7v10l-4-4" strokeWidth="2" />
                      <line x1="4" y1="4" x2="20" y2="20" stroke="red" strokeWidth="2" />
                    </svg>
                  </div>
                ) : (
                  <video
                    ref={localVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video bg-black rounded-lg"
                  />
                )}
              </div>
            )}
          </div>


        </div>
        <div>
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
          <div className="flex gap-2 items-center bg-[#232e39] rounded-lg px-4 py-2">
            <span className={`w-3 h-3 rounded-full inline-block shadow
              ${callEnded ? 'bg-red-500' : callAccepted ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className={`text-sm font-semibold
              ${callEnded ? 'text-red-400' : callAccepted ? 'text-green-400' : 'text-yellow-400'}`}>
              {callEnded
                ? "Session ended"
                : callAccepted
                  ? "Connected"
                  : "Waiting..."}
            </span>
          </div>

          {/* button menu */}
          <Button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg bg-button hover:bg-blue-700 text-white transition active:scale-95"
            title="Session Info"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Button>

          {showMenu && (
            <div className="absolute bottom-16 left-0 bg-[#232e39] rounded-lg shadow-2xl p-4 flex flex-col gap-3 w-64">
              {/* Skill */}
              {sessionInfo && (
                <div className="text-sm">
                  <span className="text-gray-400">Skill: </span>
                  <span className="text-blue-400">{sessionInfo.skill_name}</span>
                </div>
              )}
              {sessionInfo && (
                <div className="text-sm">
                  <span className="text-gray-400">Time: </span>
                  <span className="text-blue-400">
                    {sessionInfo.start_time.slice(0, 5)} - {sessionInfo.end_time.slice(0, 5)}
                  </span>
                </div>
              )}
              {/* Participants */}
              {participants.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-400">Participants:</span>
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-white">{p.name}</span>
                      <Badge className={p.role === 'Mentor' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}>
                        {p.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2  bg-[#232e39] rounded-lg shadow-xl flex h-[54px] gap-4 px-6 py-2 items-center">
        <Button
          onClick={leaveSession}
          className="w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg bg-red-500 hover:bg-red-600 text-white transition active:scale-95"
          title="Leave session"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
        <Button
          onClick={toggleMute}
          className={`w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg transition active:scale-95 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-button hover:bg-blue-600'}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </Button>
        <Button
          onClick={toggleCamera}
          className={`w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg transition active:scale-95 ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-button hover:bg-blue-600'}`}
          title={isCameraOff ? "Enable camera" : "Disable camera"}
        >
          {isCameraOff ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="red" strokeWidth="2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="7" width="15" height="10" rx="2" ry="2" strokeWidth="2" />
              <path d="M21 7v10l-4-4" strokeWidth="2" />
            </svg>
          )}
        </Button>
        <Button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg transition active:scale-95 ${isScreenSharing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-button hover:bg-blue-600'}`}
          title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
        >
          {isScreenSharing ? (
            <svg className="w-8 h-8" fill="red" viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="14" rx="2" ry="2" strokeWidth="2" stroke="currentColor" fill="none" />
              <path d="M8 21h8" strokeWidth="2" stroke="currentColor" fill="none" />
            </svg>
          )}
        </Button>
        <Button
          onClick={() => {
            const mainContainer = document.querySelector('.main');
            if (!document.fullscreenElement) {
              mainContainer.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          className="w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg bg-button hover:bg-blue-600 text-white transition active:scale-95"
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          )}
        </Button>
        <div className="relative">
          <Button
            onClick={() => setShowChat(true)}
            className="w-10 h-10 p-0 rounded-full text-2xl flex items-center justify-center shadow-lg bg-button hover:bg-blue-700 text-white transition active:scale-95"
            title="Open chat"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {hasUnreadChat && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#232e39] animate-ping"></span>
            )}
          </Button>
        </div>
      </div>
</div>
      </div>
      {/* Chat sidebar */}

      {showChat && (
        <div className="fixed bottom-20 right-6 z-50 w-[90vw] max-w-xs md:max-w-md bg-[#181f25] border border-[#232e39] rounded-lg shadow-2xl flex flex-col h-[60vh]">
          <h3 className="text-lg font-semibold p-4 flex items-center gap-2 border-b border-[#232e39]">
            <span>Chat</span>
            <button onClick={() => setShowChat(false)} className="ml-auto text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 py-2 min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.self ? 'justify-end' : 'justify-start'} items-center gap-2`}
              >
                {!msg.self && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    <img src={msg.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
                <div className="flex flex-col max-w-[70%]">
                  <span className="text-xs font-semibold text-gray-300 mb-1">
                    {msg.user}
                  </span>
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm break-words ${
                      msg.self
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span
                    className={`text-xs text-gray-400 mt-1 ${
                      msg.self ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
                {msg.self && (
                  <div className="w-8 h-8 rounded-full border-1 border-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    <img src={msg.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex gap-2 p-4 border-t border-[#232e39] bg-[#181f25]"
          >
            <input
              className="flex-1 rounded bg-[#232e39] text-white px-3 py-2 outline-none text-sm"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="bg-button text-white px-4 py-2 rounded font-semibold text-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
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
                onClick={handleRatingSubmit}
                disabled={rating === 0}
              >
                Submit
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


