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
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-base font-medium">Session Request</span>
      </div>

      <div className="flex flex-col gap-2 bg-[#1a2634] p-3 rounded-lg w-full">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-300">{day} {month} at {startTime} - {endTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm text-gray-300">Skill to learn: <span className="text-blue-400 font-semibold">{skill}</span></span>
        </div>

        {session.mode && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-300">Mode: <span className="text-blue-400 font-semibold">{session.mode === 'online' ? 'Online' : 'In Person'}</span></span>
          </div>
        )}

        {session.location && session.mode === 'in_person' && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-300">Location: <span className="text-blue-400 font-semibold">{session.location}</span></span>
          </div>
        )}

        {session.notes && (
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-300">Notes: <span className="text-blue-400">{session.notes}</span></span>
          </div>
        )}
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
        <div className={`text-center flex flex-col justify-center rounded-2xl px-4 py-3 ${senderIsCurrentUser ? 'bg-blue-500 text-white' : 'bg-[#232e39] text-white'}`}>
          {messageText}
        {isReceiver && session.status === "pending" && (
            <div className="flex mt-4 justify-center gap-10 w-full">
            <Button
                className="bg-blue-500 text-white px-10 py-1 rounded-lg font-medium"
              onClick={() => onAccept(session.id)}
            >
              Accept
            </Button>
            <Button
            variant="outline"
                className="border-white cursor-pointer text-black rounded-lg font-medium px-10 transition hover:bg-white/10"
              onClick={() => onDecline(session.id)}
            >
              Decline
            </Button>
          </div>
        )}
          {session.status === "accepted" && (
            <div className="flex justify-center mt-4">
              <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Session Accepted
              </span>
            </div>
          )}
          {session.status === "declined" && (
            <div className="flex justify-center mt-4">
              <span className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Session Declined
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