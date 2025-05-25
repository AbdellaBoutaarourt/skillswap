import PropTypes from 'prop-types';
import { Button } from '../components/ui/button';
import defaultAvatar from '../assets/user.png';

export default function SessionRequestMessage({ session, isReceiver, onAccept, onDecline, user, selectedUser }) {
  const senderIsCurrentUser = session.scheduled_by === user.id;
  // Format date and time
  const dateObj = new Date(session.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('en-GB', { month: 'long' });
  const startTime = session.start_time?.slice(0, 5);
  const endTime = session.end_time?.slice(0, 5);
  const skill = session.skill_name || "the requested";

  const messageText = (
    <div className="flex flex-col items-start gap-2">
      <span className="text-base font-medium">I sent you a session request:</span>
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="bg-[#111B23] text-white px-2 py-0.5 rounded-md text-sm font-semibold">
          {day} {month} at {startTime} to {endTime}
        </span>
        <span className="text-sm text-white">to learn about</span>
        <span className="bg-[#111B23] text-white px-2 py-0.5 rounded-md text-sm font-semibold">
          {skill}
        </span>
        <span className="text-sm text-white">skill.</span>
      </div>
    </div>
  );
  return (
    <div className={`flex ${senderIsCurrentUser ? 'justify-end' : 'justify-start'} items-start gap-2`}>
      {!senderIsCurrentUser && (
        <img
          src={selectedUser.avatar_url || defaultAvatar}
          alt={selectedUser.username}
          className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover mt-1"
        />
      )}
      <div className="flex flex-col max-w-[60%]">
        {!senderIsCurrentUser && (
          <span className="text-xs text-white font-semibold mb-1 ml-1">
            {selectedUser.username}
          </span>
        )}
        <div className={` text-center flex flex-col justify-center rounded-2xl px-4 py-2 ${senderIsCurrentUser ? 'bg-blue-500 text-white' : 'bg-[#232e39] text-white'}`}>
          <span className="font-semibold">Session request: </span>
          {messageText}
          {isReceiver && session.status === "pending" && (
          <div className="flex  mt-2 justify-center gap-10 w-full">
            <Button
              className="bg-blue-500 text-white px-10 py-1 rounded-lg font-medium"
              onClick={() => onAccept(session.id)}
            >
              Accept
            </Button>
            <Button
            variant="outline"
              className="border-white cursor-pointer text-black  rounded-lg font-medium  px-10 transition hover:bg-white/10"
              onClick={() => onDecline(session.id)}
            >
              Decline
            </Button>
          </div>
        )}
        {session.status === "accepted" && (
          <div className="flex justify-center mt-2">
            <span className="bg-green-400 text-black px-4 py-1 rounded-full font-semibold text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Accepted
            </span>
          </div>
        )}
        {session.status === "declined" && (
          <div className="flex justify-center mt-2">
            <span className="bg-red-400 text-black px-4 py-1 rounded-full font-semibold text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Declined
            </span>
          </div>
        )}
        </div>

      </div>
    </div>
  );
}

SessionRequestMessage.propTypes = {
  session: PropTypes.object.isRequired,
  isReceiver: PropTypes.bool.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  selectedUser: PropTypes.object.isRequired,
};