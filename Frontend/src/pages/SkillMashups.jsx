import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import logo from "@/assets/logo.png";
import defaultAvatar from "@/assets/user.png";

export default function SkillMashups() {
  const [prompt, setPrompt] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      content: "Describe the skill or project you want to work on!",
      type: "prompt"
    }
  ]);
  const chatContainerRef = useRef(null);
  const [revealedPaths, setRevealedPaths] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return toast.error("Please describe your idea!");
    setMessages(prev => [
      ...prev,
      { sender: "user", content: prompt, type: "user" }
    ]);
    try {
      const { data } = await axios.post("http://localhost:5000/ai/skill-mashup", { prompt, userId: user.id });
      // Compose AI response message
      console.log(data);
      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          content: data.users && data.users.length > 0 ? "I suggest the following users:" : "Here are some suggestions:",
          type: "suggestion",
          users: data.users || [],
          skills: data.skills || [],
          fusions: data.fusions || [],
          paths: data.paths || []
        }
      ]);
      setPrompt("");
    } catch {
      toast.error("Failed to get suggestions from AI.");
    }
  }

  function renderMessage(msg, idx) {
    if (msg.sender === "ai") {
      return (
        <div
          key={idx}
          className="flex items-start gap-3 mb-6"
        >
          <div className="mt-1"><FaRobot className="text-3xl text-blue-400" /></div>
          <div className="flex flex-col max-w-[80%] md:max-w-[60%]">
            <span className="text-xs text-white font-semibold mb-1 ml-1">SkillMatch AI</span>
            <div className="bg-[#232e39] text-white rounded-lg px-5 py-4 shadow-lg border border-[#232e39]/60 transition-shadow">
              {msg.type === "prompt" && <div>{msg.content}</div>}
              {msg.type === "suggestion" && (
                <>
                  <div className="mb-2 text-md">{msg.content}</div>
                  {msg.users && msg.users.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {msg.users.map((u, i) => (
                        <div key={u.id || i} className="flex items-center gap-3 bg-[#181f25] rounded-lg px-4 py-3 border border-[#232e39]/40">
                          <img
                            src={u.avatar_url || defaultAvatar}
                            alt={u.username}
                            className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-white">
                              {u.first_name || u.last_name
                                ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                : u.username}
                            </div>
                            <div className="text-xs text-gray-300">{u.skills?.join(", ")}</div>
                          </div>
                          <a
                            href={`/profile/${u.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              className="mr-2 hover:bg-blue-700 transition"
                              type="button"
                            >
                              Profile
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.skills && msg.skills.length > 0 && (
                    <div className="mt-4">
                      <div className="font-semibold mb-1 text-md">AI-detected Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {msg.skills.map(skill => (
                          <span key={skill.id || skill.name || skill} className="bg-blue-500/20 text-white px-4 py-2 rounded-lg text-sm">
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.fusions && msg.fusions.length > 0 && (
                    <div className="mt-4">
                      <div className="font-semibold mb-1">Fusion Suggestions</div>
                      <ul className="list-disc ml-6 text-sm">
                        {msg.fusions.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {msg.paths && msg.paths.length > 0 && (
                    <div className="mt-4">
                      {!revealedPaths ? (
                        <Button size="sm" variant="outline" className="bg-button-blue text-white cursor-pointer hover:bg-white/80" onClick={() => setRevealedPaths(true)}>
                          Show Mini Skill Paths
                        </Button>
                      ) : (
                        <>
                          <div className="font-semibold mb-1">Mini Skill Paths</div>
                          <ul className="list-disc ml-6 text-sm">
                            {msg.paths.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={idx} className="flex items-start gap-3 justify-end mb-6">
          <div className="flex flex-col max-w-[80%] md:max-w-[60%]">
            <span className="text-xs text-white font-semibold mb-1 ml-1 text-right">
                {user.username || "You"}
            </span>
            <div className="bg-blue-600 text-white rounded-lg px-5 py-4 shadow-md">
              <div>{msg.content}</div>
            </div>
          </div>
          <img
            src={user.avatar || defaultAvatar}
            alt={user.username || "You"}
            className="w-8 h-8 rounded-full border-2 border-blue-500 object-cover mt-1"
          />
        </div>
      );
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#101820] via-[#181f25] to-[#232e39] flex flex-col items-center px-10 ">
      <img
        src={logo}
        alt="SkillSwap logo background"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 w-[600px] max-w-[80vw] pointer-events-none z-0 select-none"
        draggable="false"
      />
      <div className="mt-4 text-center">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight mb-2">SkillMatch AI</h1>
        <p className="text-lg text-blue-200/80 font-medium mb-1">Find the perfect collaborators for your next big idea</p>
      </div>

      <div className="w-full h-[77vh] max-h-[80vh] bg-[#181f25]/90 rounded-lg shadow-2xl border border-[#232e39]/60 p-8 pb-0 flex flex-col relative z-1 max-w-5xl">
        <div
          ref={chatContainerRef}
          className="flex flex-col flex-1 overflow-y-auto pb-8 gap-2 min-h-0 pr-2"
        >
          {messages.map((msg, idx) => renderMessage(msg, idx))}
        </div>
        <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 w-full flex items-center gap-2 p-6 bg-[#181f25] rounded-b-3xl border-t border-[#232e39] mt-2 z-10">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Type your idea..."
            rows={1}
            className="flex-1 resize-none bg-[#232e39] text-white border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: 48, maxHeight: 120 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button type="submit" className="bg-button text-white rounded-full p-3 ml-2 cursor-pointer hover:bg-blue-700 transition-all">
            <FaPaperPlane className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
}
