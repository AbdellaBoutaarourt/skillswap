import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../assets/user.png";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast, Toaster } from "sonner";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

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
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user?.id, navigate]);

  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(
            `http://localhost:5000/messages/chat/${user.id}/${selectedUser.id}`
          );
          setMessages(response.data);
        } catch (error) {
          console.error("Error fetching messages:", error);
          toast.error("Failed to load messages");
        }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    (conv.otherUser.first_name || conv.otherUser.username || conv.otherUser.last_name)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      {/* Sidebar */}
      <div className="w-[320px] border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="mb-4 px-4 py-2 rounded-full bg-[#232e39] text-white placeholder-gray-400 outline-none"
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
                  onClick={() => setSelectedUser(conv.otherUser)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={conv.otherUser.avatar_url || defaultAvatar}
                      alt={conv.otherUser.username}
                      className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {conv.otherUser.first_name || conv.otherUser.username}
                      </div>
                      <div className="text-sm text-gray-400">
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

      <div className="flex-1 flex flex-col max-h-11/12">
        <div className="flex justify-between items-center px-8 py-4 border-b border-[#232e39]">
          <div className="text-xl font-semibold text-white">{selectedUser?.first_name || selectedUser?.username}</div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">Schedule a session</button>
        </div>
        {selectedUser ? (
          <>
            <div ref={messagesContainerRef} className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[60%] rounded-2xl px-4 py-2 ${msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-[#232e39] text-white'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div className={`text-xs text-gray-400 mt-1 ${messages.length > 0 ? (messages[messages.length - 1].sender_id === user.id ? 'text-right' : 'text-left') : ''}`}>
                {messages.length > 0 ? new Date(messages[messages.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 px-8 py-2 border-t border-[#232e39] bg-[#151d23] sticky bottom-0"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here"
                className="flex-1 px-4 py-2 rounded-full bg-[#232e39] text-white placeholder-gray-400 outline-none h-10"
              />
              <Button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium h-10">send</Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Select a conversation.
          </div>
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}