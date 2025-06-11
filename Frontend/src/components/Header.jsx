import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import defaultAvatar from "../assets/user.png";
import axios from "axios";
import { MdNotifications, MdMessage, MdPerson, MdLogout, MdArrowForward } from 'react-icons/md';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        //Get swap requests
        const { data: swapRequests } = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
        const pendingSwaps = swapRequests.filter(req => req.receiver_id === user.id && req.status === 'pending');

        // Get combine requests
        const { data: combineRequests } = await axios.get(`http://localhost:5000/skills/combine-requests/user/${user.id}`);
        const pendingCombines = combineRequests.filter(req => req.receiver_id === user.id && req.status === 'pending');

        // Enrich the data with the requester's info
        const enrichedSwaps = await Promise.all(
          pendingSwaps.map(async (req) => {
            const { data: requester } = await axios.get(`http://localhost:5000/users/profile/${req.requester_id}`);
            return { ...req, requester, type: 'swap' };
          })
        );

        const enrichedCombines = await Promise.all(
          pendingCombines.map(async (req) => {
            const { data: requester } = await axios.get(`http://localhost:5000/users/profile/${req.requester_id}`);
            return { ...req, requester, type: 'combine' };
          })
        );

        setNotifications([...enrichedSwaps, ...enrichedCombines]);

      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();

    const fetchUnreadMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/count/unread/${user.id}`);
        setUnreadMessages(response.data.count);
      } catch (error) {
        console.error("Failed to fetch unread messages:", error);
      }
    };


    const skillRequestChannel = supabase
      .channel('skill-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skill_requests', filter: `receiver_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const combineRequestChannel = supabase
      .channel('combine-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skill_combine_requests', filter: `receiver_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-realtime-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(skillRequestChannel);
      supabase.removeChannel(combineRequestChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    setDropdownOpen(false);
    navigate('/login');
  }

  const NotificationDropdown = () => (
    <div className="absolute top-15 right-3 md:top-auto md:right-0 mt-3 w-96 max-w-xs bg-[#181f25] text-white rounded-lg shadow-2xl border border-[#232e39] z-50 max-h-[400px] overflow-y-auto">
      {notifications.map((notif) => (
        <div key={notif.id} className="flex flex-col w-full py-4 px-3 hover:bg-[#232e39] transition-colors first:rounded-t-lg last:rounded-b-lg cursor-pointer group">
          <div className="flex flex-row gap-4 items-center w-full min-w-0">
            <img
              src={notif.requester.avatar_url || defaultAvatar}
              alt={notif.requester.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 flex-shrink-0"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2 w-full">
                <span className="font-bold text-white truncate">
                  {`${notif.requester.first_name} ${notif.requester.last_name}`}
                </span>

              </div>
              <div className="mt-1 text-sm w-full">
                {notif.type === 'swap' ? (
                  <>
                    <span className="text-blue-400 font-semibold">Swap request:</span>
                    <span className="ml-2 text-white">{notif.requested_skill}</span>
                  </>
                ) : (
                  <>
                    <span className="text-purple-400 font-semibold">Skill combination request:</span>
                    <span className="ml-2 text-white">{notif.prompt}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-xs text-gray-400 mb-2">Visit profile to accept or decline request</span>
            <div className="flex justify-end mt-2">
              <button
                className="flex cursor-pointer gap-2 bg-button hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm transition"
                onClick={() => {
                  navigate(`/profile/${notif.requester.id}?requestId=${notif.id}${notif.type === 'combine' ? '&combine=true' : ''}`);
                  setNotifOpen(false);
                }}
              >
                <MdArrowForward className="w-4 h-4" />
                View profile
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );


  return (
    <header className="flex items-center justify-between px-6 py-2 border-b border-white font-poppins relative bg-[#111B23]">
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" />
      </div>
      <div className="flex items-center md:hidden gap-2">
      {user && (
          <button className="mx-2 relative cursor-pointer md:hidden" aria-label="Notifications" onClick={() => setNotifOpen(!notifOpen)}>
            <MdNotifications className="w-6 h-6 text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {notifications.length}
              </span>
            )}
          </button>
        )}
        {notifOpen && notifications.length > 0 && (
          <NotificationDropdown />
        )}
        {!menuOpen && (
          <button
            className="md:hidden text-white focus:outline-none z-20 cursor-pointer"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

      </div>
      <nav className="hidden md:flex items-center space-x-6">
        <Link
          to="/"
          className={`text-white hover:text-secondary font-medium border-b-2 transition-all duration-150 text-lg ${location.pathname === '/' ? 'border-blue-500' : 'border-transparent hover:border-white'}`}
        >
          Home
        </Link>
        <Link
          to="/explore"
          className={`text-white hover:text-secondary font-medium border-b-2 transition-all duration-150 text-lg ${location.pathname.startsWith('/explore') ? 'border-blue-500' : 'border-transparent hover:border-white'}`}
        >
          Explore
        </Link>
        {user && (
          <Link
            to="/sessions"
            className={`text-white hover:text-secondary font-medium border-b-2 transition-all duration-150 text-lg ${location.pathname.startsWith('/sessions') ? 'border-blue-500' : 'border-transparent hover:border-white'}`}
          >
            Sessions
          </Link>
        )}
        {user ? (
          <>
            <Link
              to="/mashups"
              className={`px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer bg-blue-500 hover:bg-blue-700 text-white ${location.pathname.startsWith('/mashups') ? 'ring-2 ring-blue-400' : ''}`}
            >
              Skill Mashups
            </Link>
            <Link
              to="/messages"
              className={`relative mx-2 cursor-pointer ${location.pathname === '/messages' ? 'text-blue-500' : 'text-white'}`}
            >
              <MdMessage className="w-6 h-6 text-white" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <div className="relative hidden md:block">
              <button className="mx-2 relative cursor-pointer " aria-label="Notifications" onClick={() => {
                setNotifOpen(!notifOpen);
                setDropdownOpen(false);
              }}>
                <MdNotifications className="w-6 h-6 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && notifications.length > 0 && (
                 <NotificationDropdown />
              )}
            </div>
            <div className="relative">
              <button
                className="focus:outline-none"
                onClick={() => {
                  setDropdownOpen((open) => !open);
                  setNotifOpen(false);
                }}
                aria-label="Open profile menu"
              >
                <img
                  src={user.avatar || defaultAvatar}
                  alt="profile"
                  className="w-7 h-7 rounded-full border-2 border-blue-500 object-cover cursor-pointer"
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#181f25] text-white rounded-lg shadow-lg py-2 z-50 border border-[#232e39]">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2  hover:bg-[#232e39]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <MdPerson className="w-5 h-5 mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2  hover:bg-[#232e39] cursor-pointer"
                  >
                    <MdLogout className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
        <Link to="/login" className="bg-button hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer">
          Sign In
        </Link>
        )}
      </nav>
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-[#0a1218] p-6 flex flex-col space-y-6 shadow-lg z-30 transform transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button
          className="absolute top-4 right-4 text-white z-40 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mt-12 flex flex-col space-y-6">
          <Link to="/" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/explore" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg" onClick={() => setMenuOpen(false)}>
            Explore
          </Link>
          {user && (
            <Link to="/sessions" className="text-white hover:text-secondary font-medium border-b-2 border-transparent hover:border-white transition-all duration-150 text-lg" onClick={() => setMenuOpen(false)}>
              Sessions
            </Link>
          )}
          {user ? (
            <>
              <Link to="/mashups" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer" onClick={() => setMenuOpen(false)}>
                Skill Mashups
              </Link>
              <Link to="/messages" className="flex items-center space-x-2  py-2 text-white hover:bg-gray-800 rounded" onClick={() => setMenuOpen(false)}>
                <MdMessage className="w-5 h-5 text-white" />
                <span>Messages</span>
              </Link>
              <Link to="/sessions" className="flex items-center space-x-2  py-2 text-white hover:bg-gray-800 rounded" onClick={() => setMenuOpen(false)}>
                <MdPerson className="w-5 h-5 text-white" />
                <span>Sessions</span>
              </Link>
              <Link to="/profile" className="flex items-center space-x-2  py-2 text-white hover:bg-gray-800 rounded" onClick={() => setMenuOpen(false)}>
                <img src={user.avatar || defaultAvatar} alt="profile" className="w-7 h-7 rounded-full border-2 border-blue-500 object-cover" />
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="w-full text-left  py-2 text-white hover:bg-gray-800 rounded">
                Logout
              </button>
            </>
          ) : (
          <Link to="/login" className="bg-button hover:bg-blue-700 cursor-pointer text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg" onClick={() => setMenuOpen(false)}>
            Sign In
          </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
