import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast, Toaster } from "sonner";
import SessionRequestMessage from "../components/SessionRequestMessage";
import SessionDialog from "../components/SessionDialog";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const { userId } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [sessions, setSessions] = useState([]);
  const didInitialScroll = useRef(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const fetchConversations = async () => {
      try {
        const messagesResponse = await axios.get(`http://localhost:5000/messages/conversations/${user.id}`);
        const messageConversations = messagesResponse.data;

        const requestsResponse = await axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`);
        const acceptedRequests = requestsResponse.data.filter(req => req.status === 'accepted');

        const enrichedRequests = await Promise.all(
          acceptedRequests.map(async (req) => {
            const otherUserId = req.requester_id === user.id ? req.receiver_id : req.requester_id;
            const { data: otherUser } = await axios.get(`http://localhost:5000/users/${otherUserId}`);
            return {
              otherUser,
              last_message: "Start a conversation",
              last_message_time: req.updated_at,
              unread_count: 0,
              is_request: true,
              requested_skill: req.requested_skill
            };
          })
        );

        const allConversations = [...messageConversations, ...enrichedRequests];

        const uniqueConversations = allConversations.reduce((acc, curr) => {
          const existingIndex = acc.findIndex(c => c.otherUser.id === curr.otherUser.id);
          if (existingIndex === -1) {
            acc.push(curr);
          }
          return acc;
        }, []);

        uniqueConversations.sort((a, b) =>
          new Date(b.last_message_time) - new Date(a.last_message_time)
        );

        setConversations(uniqueConversations);

        if (userId) {
          const conversation = uniqueConversations.find(conv => conv.otherUser.id === parseInt(userId));
          if (conversation) {
            setSelectedUser(conversation.otherUser);
          } else {
            const { data: otherUser } = await axios.get(`http://localhost:5000/users/${userId}`);
            setSelectedUser(otherUser);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id, navigate, userId]);

  const fetchSessions = async () => {
    if (!selectedUser || !user.id) return;
    const { data } = await axios.get(
      `http://localhost:5000/sessions/${user.id}/${selectedUser.id}`
    );
    setSessions(data);
  };

  useEffect(() => {
    if (!selectedUser || !user?.id) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/messages/chat/${user.id}/${selectedUser.id}`
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();

    // Fetch initial sessions
    const fetchSessions = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/sessions/${user.id}/${selectedUser.id}`
        );
        setSessions(data);
        scrollToBottom();

      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };
    fetchSessions();

    // Realtime subscription for messages
    const messageChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Realtime subscription for sessions
    const sessionChannel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          const s = payload.new || payload.old;
          if (!s) return;
          setSessions(prev => {
            const filtered = prev.filter(sess => sess.id !== s.id);
            return [...filtered, payload.new];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [selectedUser, user?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`http://localhost:5000/messages`, {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: newMessage,
      });
      setNewMessage("");
      const response = await axios.get(
        `http://localhost:5000/messages/chat/${user.id}/${selectedUser.id}`
      );
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    (conv.otherUser.username.toLowerCase().includes(search.toLowerCase()) ||
    conv.otherUser.first_name.toLowerCase().includes(search.toLowerCase()) ||
    conv.otherUser.last_name.toLowerCase().includes(search.toLowerCase()))
  );

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!didInitialScroll.current && messages.length > 0) {
      scrollToBottom();
      didInitialScroll.current = true;
    }
  }, [messages]);

  useEffect(() => {
    if (sessions.length > 0) {
      scrollToBottom();
    }
  }, [sessions]);

  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    //  compare dates
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.created_at);
    const previousDate = new Date(previousMessage.created_at);

    return currentDate.getDate() !== previousDate.getDate() ||
           currentDate.getMonth() !== previousDate.getMonth() ||
           currentDate.getFullYear() !== previousDate.getFullYear();
  };

  const handleSessionScheduled = async () => {
    if (!selectedUser || !user?.id) return;
    await fetchSessions();
    scrollToBottom();
  };

  const handleAcceptSession = async (sessionId) => {
    try {
      await axios.patch(`http://localhost:5000/sessions/${sessionId}`, { status: 'accepted' });
      await fetchSessions();
      scrollToBottom();
      toast.success('Session accepted!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to accept session');
    }
  };

  const handleDeclineSession = async (sessionId) => {
    try {
      await axios.patch(`http://localhost:5000/sessions/${sessionId}`, { status: 'declined' });
      await fetchSessions();
      scrollToBottom();
      toast.success('Session declined.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to decline session');
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);


  //  sort messages and sessions
  const allItems = [
    ...messages.map(m => ({ ...m, type: 'message' })),
    ...sessions.map(s => ({ ...s, type: 'session' }))
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations"
          className="mb-4 px-4 py-2 rounded-lg bg-[#181f25] text-white placeholder-gray-400 outline-none"
        />
        <h2 className="text-xl font-bold mb-4">Conversations</h2>
        {filteredConversations.length === 0 ? (
          <p className="text-gray-400">No conversations yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.otherUser.id}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedUser?.id === conv.otherUser.id
                    ? "bg-blue-600"
                    : "hover:bg-gray-800"
                }`}
                onClick={() => {
                  setSelectedUser(conv.otherUser);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={conv.otherUser.avatar_url || defaultAvatar}
                    alt={conv.otherUser.username}
                    className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {conv.otherUser.username}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {conv.is_request ? (
                        <span className="text-blue-400">
                          {conv.requested_skill} - Start a conversation
                        </span>
                      ) : (
                        conv.last_message
                      )}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111B23]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-gray-400">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#111B23] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[320px] border-r border-gray-800">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild>
          <span />
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] p-0 bg-[#111B23] border-r border-gray-800 text-white pt-6">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col max-h-11/12">
        <div className="sticky top-0  bg-[#111B23] border-b border-[#232e39] flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="md:hidden p-2 mr-2 -ml-2 bg-transparent hover:bg-[#232e39]"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <div className="text-xl font-semibold text-white truncate">
              {selectedUser?.first_name || selectedUser?.username || "Messages"}
            </div>
          </div>
          {selectedUser && (
            <Button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium ml-2"
              onClick={() => setSessionDialogOpen(true)}
            >
              Schedule a session
            </Button>
          )}
        </div>

        {selectedUser ? (
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 md:p-8 flex flex-col gap-4 overflow-y-auto"
            >
              {allItems.map((item, index) => (
                item.type === 'session' ? (
                  <SessionRequestMessage
                    key={`session-${item.id}`}
                    session={item}
                    isReceiver={user.id === item.scheduled_with}
                    onAccept={handleAcceptSession}
                    onDecline={handleDeclineSession}
                    user={user}
                    selectedUser={selectedUser}
                  />
                ) : (
                  <div key={`message-${item.id}`}>
                    {shouldShowDateSeparator(item, allItems[index - 1]) && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-gray-400 bg-[#181f25] px-3 py-1 rounded-full">
                          {formatMessageDate(item.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${item.sender_id === user.id ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                      {item.sender_id !== user.id && (
                        <img
                          src={selectedUser.avatar_url || defaultAvatar}
                          alt={selectedUser.username}
                          className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover mt-1"
                        />
                      )}
                      <div className="flex flex-col max-w-[80%] md:max-w-[60%]">
                        {item.sender_id !== user.id && (
                          <span className="text-xs text-white font-semibold mb-1 ml-1">
                            {selectedUser.username}
                          </span>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${item.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-[#181f25] text-white'}`}>
                          {item.content}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${item.sender_id === user.id ? 'text-right' : 'text-left'}`}>
                      {formatMessageDate(item.created_at)}
                    </div>
                  </div>
                )
              ))}
            </div>
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 px-4 md:px-8 py-2 border-t border-[#232e39] bg-[#151d23] sticky bottom-0"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here"
                className="flex-1 px-4 py-2 rounded-lg bg-[#181f25] text-white placeholder-gray-400 outline-none h-10"
              />
              <Button type="submit" className="bg-blue-500 text-white px-6 font-medium">
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Select a conversation
          </div>
        )}
      </div>

      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        selectedUser={selectedUser}
        onSessionScheduled={handleSessionScheduled}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}