"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resume data aur job role — URL params se aayega
  const [jobRole, setJobRole] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [resumeData, setResumeData] = useState<any>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Page load hone pe localStorage se resume data lo
  useEffect(() => {
    const stored = localStorage.getItem("interviewResume");
    if (stored) {
      const data = JSON.parse(stored);
      setResumeData(data);
      // Resume se job role auto-detect karo
      const autoRole = data?.experience?.[0]?.role?.split("@")[0]?.trim() || "";
      setJobRole(autoRole);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isTyping]);

  const startInterview = async () => {
    const finalRole = manualRole.trim() || jobRole;
    if (!finalRole) {
      alert("Job role daalo pehle!");
      return;
    }
    setJobRole(finalRole);
    setInterviewStarted(true);

    // AI se pehla question mangwao
    await sendMessage("Hello, I'm ready to start the interview.", finalRole, []);
  };

  const sendMessage = async (
    message: string,
    role?: string,
    existingConversation?: Message[]
  ) => {
    const finalRole = role || jobRole;
    const currentConversation = existingConversation ?? conversation;

    const newUserMessage: Message = { role: "user", content: message };
    const updatedConversation = [...currentConversation, newUserMessage];

    if (existingConversation === undefined) {
      setConversation(updatedConversation);
      setUserInput("");
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(
        "https://unicorn-backend-3.onrender.com/api/interview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_data: resumeData || {},
            job_role: finalRole,
            conversation: updatedConversation,
          }),
        }
      );

      if (!response.ok) throw new Error("Backend error!");
      const data = await response.json();

      const aiMessage: Message = { role: "assistant", content: data.reply };
      setConversation([...updatedConversation, aiMessage]);
    } catch (error) {
      console.error("Interview error:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "Kuch gadbad hui. Backend check karo aur dobara try karo.",
      };
      setConversation([...updatedConversation, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    sendMessage(userInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #04020d; font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }
        .msg-bubble { animation: fadeInUp 0.3s ease both; }
        .typing-dot { animation: typing 1.2s infinite; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #a78bfa; margin: 0 2px; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        textarea:focus { outline: none; border-color: rgba(167,139,250,0.4) !important; }
        .send-btn:hover:not(:disabled) { background: rgba(167,139,250,0.9) !important; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#04020d", display: "flex", flexDirection: "column" }}>

        {/* Background */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50vw", height: "50vh", background: "radial-gradient(circle, rgba(91,33,182,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "40vw", height: "40vh", background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        {/* Navbar */}
        <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "16px" }}>🎤</span>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px", background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI Mock Interview
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {interviewStarted && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "999px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", animation: "pulseBadge 2s infinite" }} />
                <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600 }}>Live Interview</span>
              </div>
            )}
            <button onClick={() => router.push("/")}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "8px 18px", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              ← Back
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", maxWidth: "820px", width: "100%", margin: "0 auto", padding: "24px 20px", gap: "20px" }}>

          {/* PRE-START SCREEN */}
          {!interviewStarted && (
            <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "36px", animation: "fadeInUp 0.4s ease" }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                Ready for your Mock Interview? 🎯
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "28px", lineHeight: "1.6" }}>
                AI interviewer will ask role-specific questions using STAR method, follow up on your answers, and give you a real interview experience.
              </p>

              {/* Auto-detected role */}
              {jobRole && (
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>✅</span>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(16,185,129,0.7)", fontWeight: 600, marginBottom: "2px" }}>AUTO-DETECTED FROM RESUME</p>
                    <p style={{ fontSize: "14px", color: "#fff", fontWeight: 600 }}>{jobRole}</p>
                  </div>
                </div>
              )}

              {/* Manual override */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                  {jobRole ? "Ya apna role manually likho (optional override):" : "Job role likho:"}
                </label>
                <input
                  type="text"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, React Developer, Data Analyst..."
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "14px", outline: "none" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(167,139,250,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* What to expect */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
                {[
                  { icon: "🧠", text: "STAR method questions" },
                  { icon: "🔄", text: "Dynamic follow-ups" },
                  { icon: "💼", text: "Resume-based questions" },
                  { icon: "📊", text: "Behavioral + Technical mix" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px" }}>{item.icon}</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <button onClick={startInterview} disabled={isLoading}
                style={{ width: "100%", height: "52px", borderRadius: "999px", background: "#fff", color: "#030014", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", transition: "all 0.2s", opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? "Starting..." : "🎤 Start Interview"}
              </button>
            </div>
          )}

          {/* CHAT AREA */}
          {interviewStarted && (
            <>
              {/* Role badge */}
              <div style={{ textAlign: "center" }}>
                <span style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}>
                  Interviewing for: {jobRole}
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minHeight: "400px" }}>
                {conversation
                  .filter((msg) => msg.content !== "Hello, I'm ready to start the interview.")
                  .map((msg, i) => (
                    <div key={i} className="msg-bubble" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && (
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", flexShrink: 0, marginTop: "4px" }}>
                          <span style={{ fontSize: "14px" }}>🤖</span>
                        </div>
                      )}
                      <div style={{
                        maxWidth: "75%",
                        padding: "14px 18px",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: msg.role === "user" ? "rgba(167,139,250,0.15)" : "rgba(10,7,24,0.7)",
                        border: msg.role === "user" ? "1px solid rgba(167,139,250,0.25)" : "1px solid rgba(255,255,255,0.07)",
                        fontSize: "14px",
                        color: "#f1f5f9",
                        lineHeight: "1.65",
                        whiteSpace: "pre-wrap"
                      }}>
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "10px", flexShrink: 0, marginTop: "4px" }}>
                          <span style={{ fontSize: "14px" }}>👤</span>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="msg-bubble" style={{ display: "flex", alignItems: "flex-start" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "14px" }}>🤖</span>
                    </div>
                    <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(10,7,24,0.7)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "2px" }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input box */}
              <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Apna jawab yahan likho... (Enter to send, Shift+Enter for new line)"
                  disabled={isLoading}
                  rows={3}
                  style={{ flex: 1, background: "transparent", border: "none", color: "#f1f5f9", fontSize: "14px", resize: "none", lineHeight: "1.6", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !userInput.trim()}
                  className="send-btn"
                  style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(167,139,250,0.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#04020d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>}>
      <InterviewContent />
    </Suspense>
  );
}