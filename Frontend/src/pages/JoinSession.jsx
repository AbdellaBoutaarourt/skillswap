import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import SimplePeer from "simple-peer/";
import socket from "../socket";


export default function JoinSession() {
  const { sessionId } = useParams();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [users, setUsers] = useState([]);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const navigate = useNavigate();
  const offerReceived = useRef(false);
  const answerReceived = useRef(false);

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

        // Update users in session
        socketRef.current.on("users-in-session", setUsers);


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

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#111B23] text-white">
      <h1 className="text-2xl font-bold mb-4">Session {sessionId}</h1>
      <div className="flex gap-8">
        <div>
          <div className="mb-2">Your video</div>
          <video ref={localVideo} autoPlay muted playsInline className="w-64 h-48 bg-black rounded-lg" />
        </div>
        <div>
          <div className="mb-2">Remote video</div>
          <video ref={remoteVideo} autoPlay playsInline className="w-64 h-48 bg-black rounded-lg" />
        </div>
      </div>
      <Button className="mt-8 bg-red-500 text-white" onClick={leaveSession}>
        Leave session
      </Button>
      <div className="mt-4 text-sm text-gray-400">
        {callEnded
          ? "Call ended"
          : callAccepted
            ? "Connected!"
            : "Waiting for another participant..."}
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Users in session:</h2>
        <ul className="list-disc pl-5">
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
