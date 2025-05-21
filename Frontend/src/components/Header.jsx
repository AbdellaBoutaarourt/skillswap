import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import defaultAvatar from "../assets/user.png";
import axios from "axios";

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
        const { data } = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
        const pending = data.filter(req => req.receiver_id === user.id && req.status === 'pending');

        const enriched = await Promise.all(
          pending.map(async (req) => {
            const { data: requester } = await axios.get(`http://localhost:5000/users/${req.requester_id}`);
            return { ...req, requester };
          })
        );

        setNotifications(enriched);

      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();

    const handleRefreshNotifications = () => {
      fetchNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefreshNotifications);

    const fetchUnreadMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/count/unread/${user.id}`);
        setUnreadMessages(response.data.count);
      } catch (error) {
        console.error("Failed to fetch unread messages:", error);
      }
    };

    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 10000);

    window.addEventListener('refreshUnreadMessages', fetchUnreadMessages);

    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
      clearInterval(interval);
    };
  }, [user.id]);


  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    setDropdownOpen(false);
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between px-6 py-2 border-b border-white font-poppins relative bg-[#101820]">
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" />
      </div>
      {!menuOpen && (
        <button
          className="md:hidden text-white focus:outline-none z-20 cursor-pointer"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
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
        {user ? (
          <>
            <Link
              to="/mashups"
              className={`px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white ${location.pathname.startsWith('/mashups') ? 'ring-2 ring-blue-400' : ''}`}
            >
              Skill Mashups
            </Link>
            <Link
              to="/messages"
              className={`relative mx-2 cursor-pointer ${location.pathname === '/messages' ? 'text-blue-500' : 'text-white'}`}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <div className="relative">
              <button className="mx-2 relative cursor-pointer" aria-label="Notifications" onClick={() => setNotifOpen(!notifOpen)}>
                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg py-2 z-50">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 border-b last:border-b-0">
                      <div className="mb-2">
                        <span className="font-semibold">
                          {(notif.requester.first_name || notif.requester.last_name)
                            ? `${notif.requester.first_name || ''} ${notif.requester.last_name || ''}`.trim()
                            : notif.requester.username
                          }
                        </span>
                        {" wants to learn: "}
                        <span className="text-blue-600">{notif.requested_skill}</span>
                        <div className="text-xs text-gray-600 mt-1">
                          Please check their profile before accepting or declining this request.
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-3 mt-2 cursor-pointer"
                        onClick={() => navigate(`/profile/${notif.requester.id}?requestId=${notif.id}`)}
                        title="View profile"
                      >
                        <img
                          src={notif.requester.avatar_url || defaultAvatar}
                          alt={notif.requester.username}
                          className="w-10 h-10 rounded-full object-cover border border-blue-500"
                        />
                        <div>
                          <div className="font-bold">
                            {(notif.requester.first_name || notif.requester.last_name)
                              ? `${notif.requester.first_name || ''} ${notif.requester.last_name || ''}`.trim()
                              : notif.requester.username
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {notif.requester.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className="focus:outline-none"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label="Open profile menu"
              >
                <img
                  src={user.avatar || defaultAvatar}
                  alt="profile"
                  className="w-7 h-7 rounded-full border-2 border-blue-500 object-cover cursor-pointer"
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <Link
                    to="/messages"
                    className="flex items-center px-4 py-2  hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Messages
                  </Link>
                  <Link
                    to="/sessions"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4v1a4 4 0 01-4 4H7a4 4 0 01-4-4v-1"/>
                    </svg>
                    Sessions
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2  hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"/>
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2  hover:bg-gray-100 cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/>
                    </svg>
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
        style={{ willChange: 'transform' }}
      >
        <button
          className="absolute top-4 right-4 text-white z-40 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
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
          {user ? (
            <>
              <Link to="/mashups" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-semibold focus:outline-none transition text-lg cursor-pointer" onClick={() => setMenuOpen(false)}>
                Skill Mashups
              </Link>
              <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-gray-800 rounded" onClick={() => setMenuOpen(false)}>
                <img src={user.avatarUrl || defaultAvatar} alt="profile" className="w-7 h-7 rounded-full border-2 border-blue-500 object-cover" />
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 rounded">
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
