import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import SimplePeer from "simple-peer/";
import socket from "../socket";
import axios from "axios";

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
  const user = JSON.parse(localStorage.getItem("user"));

  const toggleMute = () => {

      if (peerRef.current) {
        peerRef.current.streams[0].getAudioTracks()[0].enabled = isMuted;
      }

      setIsMuted(!isMuted);
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
    const fetchSessionInfo = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/sessions/${sessionId}`);
        setSessionInfo(data);

        // Récupérer les informations des participants
        const mentorId = data.scheduled_by;
        const learnerId = data.scheduled_with;

        const [mentorData, learnerData] = await Promise.all([
          axios.get(`http://localhost:5000/users/${mentorId}`),
          axios.get(`http://localhost:5000/users/${learnerId}`)
        ]);

        setParticipants([
          {
            id: mentorId,
            name: `${mentorData.data.first_name} ${mentorData.data.last_name}`,
            role: 'Mentor'
          },
          {
            id: learnerId,
            name: `${learnerData.data.first_name} ${learnerData.data.last_name}`,
            role: 'Learner'
          }
        ]);
      } catch (error) {
        console.error("Error fetching session info:", error);
      }
    };
    fetchSessionInfo();
  }, [sessionId]);

  const leaveSession = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.off("peer-joined");
      socketRef.current.off("signal");
      socketRef.current.off("users-in-session");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCallEnded(true);
    setCallAccepted(false);
    navigate('/sessions');
  };

  useEffect(() => {
    async function init() {
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
        if (peerRef.current) return;

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

          try {
            peer.signal(signal);
            offerReceived.current = true;
          } catch (err) {
            console.error("Error signaling initial signal:", err);
          }
        } else {
          // Existing peer: forward signal, ignore duplicates
          if (signal.type === "offer" && offerReceived.current) return;
          if (signal.type === "offer") offerReceived.current = true;
          if (signal.type === "answer" && answerReceived.current) return;
          if (signal.type === "answer") answerReceived.current = true;
          if (peerRef.current && !peerRef.current.destroyed) {
            try {
              peerRef.current.signal(signal);
            } catch (err) {
              console.error("Error signaling existing peer:", err);
            }
          }
        }
      });

    }


    init();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.off("peer-joined");
        socketRef.current.off("signal");
        socketRef.current.off("users-in-session");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [sessionId]);

  const isMentor = sessionInfo?.scheduled_by === user.id;

  return (
    <div className="min-h-screen bg-[#111B23] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">Skill Swap Session</h1>
              {sessionInfo && (
                <p className="text-gray-400 text-sm mt-1">
                  Learning: <span className="text-blue-400">{sessionInfo.skill_name}</span>
                </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#232e39] rounded-lg p-4">
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
                <Button
                  onClick={toggleMute}
                  className={`p-2 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </Button>
                <Button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`p-2 rounded-full ${isScreenSharing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager l'écran"}
                >
                  {isScreenSharing ? (
                    <svg className="w-5 h-5" fill="red" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="14" rx="2" ry="2" strokeWidth="2" stroke="currentColor" fill="none" />
                      <path d="M8 21h8" strokeWidth="2" stroke="currentColor" fill="none" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video bg-black rounded-lg"
            />
          </div>

          <div className="bg-[#232e39] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-lg font-semibold">Partner</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${!isMentor ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {!isMentor ? 'Mentor' : 'Learner'}
              </div>
            </div>
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-full aspect-video bg-black rounded-lg"
            />
          </div>
        </div>

        <div className="bg-[#232e39] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4v1a4 4 0 01-4 4H7a4 4 0 01-4-4v-1" />
            </svg>
            <h2 className="text-lg font-semibold">Session Status</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${callEnded ? 'bg-red-500' : callAccepted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-gray-300">
              {callEnded
                ? "Session ended"
                : callAccepted
                  ? "Connected with partner"
                  : "Waiting for partner to join..."}
            </span>
          </div>

          {participants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Session Participants:</h3>
              <div className="flex gap-4">
                {participants.map((participant) => (
                  <div key={`${participant.id}-${participant.role}`} className="bg-[#1a2634] px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className={`text-xs ${participant.role === 'Mentor' ? 'text-green-400' : 'text-blue-400'}`}>
                        {participant.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
