"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}
interface StarScore {
  total_score: number;
  breakdown: {
    situation: { score: number; max: number; feedback: string };
    task: { score: number; max: number; feedback: string };
    action: { score: number; max: number; feedback: string };
    result: { score: number; max: number; feedback: string };
  };
  weak_areas: string[];
  ideal_answer: string;
  verdict: "Excellent" | "Good" | "Average" | "Needs Work";
}

// interface ScoredMessage extends Message {
//   score?: StarScore;
//   isScoring?: boolean;
// }
// Naya — replace karo
interface QualityFeedback {
  clarity: { score: number; label: string; feedback: string };
  relevance: { score: number; label: string; feedback: string };
  length: { score: number; label: string; feedback: string };
  filler_words: { detected: string[]; count: number; score: number; feedback: string };
  missing_keywords: { words: string[]; feedback: string };
  confidence: { score: number; label: string; signals: string[]; feedback: string };
  overall_quality: number;
  one_line_verdict: string;
}

interface ScoredMessage extends Message {
  score?: StarScore;
  quality?: QualityFeedback;
  isScoring?: boolean;
}
interface PrepQuestion {
  question: string;
  category?: string;
  difficulty?: string;
  tip?: string;
  framework?: string;
  focus_area?: string;
}

interface PrepPack {
  company: string;
  role: string;
  culture: {
    summary: string;
    values: string[];
    work_style: string;
  };
  interview_process: {
    rounds: { round: string; description: string; duration: string }[];
    total_rounds: string;
    timeline: string;
  };
  technical_questions: PrepQuestion[];
  behavioral_questions: PrepQuestion[];
  company_specific_tips: string[];
  key_technologies: string[];
  red_flags_to_avoid: string[];
  preparation_timeline: {
    week1: string;
    week2: string;
    week3: string;
  };
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resume data aur job role — URL params se aayega
  const [jobRole, setJobRole] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [resumeData, setResumeData] = useState<any>(null);
  const [conversation, setConversation] = useState<ScoredMessage []>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Prep Pack states
  const [showPrepPack, setShowPrepPack] = useState(false);
  const [companyInput, setCompanyInput] = useState("");
  const [prepPack, setPrepPack] = useState<PrepPack | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"interview" | "prep">("interview");
  const [prepActiveSection, setPrepActiveSection] = useState("culture");  
  const [interviewType, setInterviewType] = useState("behavioral");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceAccent, setVoiceAccent] = useState("indian");
  const [liveWPM, setLiveWPM] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const wordCountRef = useRef<number>(0);

  const interviewTypes = [
  { id: "behavioral", label: "Behavioral HR", icon: "🧠", color: "#10b981", desc: "STAR method, soft skills, culture fit" },
  { id: "technical", label: "Technical DSA", icon: "💻", color: "#6366f1", desc: "Algorithms, coding, complexity analysis" },
  { id: "system_design", label: "System Design", icon: "🏗️", color: "#06b6d4", desc: "Architecture, scalability, trade-offs" },
  { id: "case_study", label: "Case Study", icon: "📊", color: "#f59e0b", desc: "Business problems, structured thinking" },
  { id: "product", label: "Product Management", icon: "🎯", color: "#ec4899", desc: "Product sense, metrics, roadmap" },
  { id: "leadership", label: "Leadership", icon: "👑", color: "#a78bfa", desc: "Team management, influence, vision" },
];

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
      alert("Please enter a job role to start the interview.");
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
            interview_type: interviewType,
          }),
        }
      );

      if (!response.ok) throw new Error("Backend error!");
      const data = await response.json();

      const aiMessage: Message = { role: "assistant", content: data.reply };
      setConversation([...updatedConversation, aiMessage]);
      setConversation([...updatedConversation, aiMessage]);

       // User ke answer ko score karo automatically
       // Last user message ka index find karo
       const userMsgIndex = updatedConversation.length - 1;
       const lastAiQuestion = conversation
         .filter((m) => m.role === "assistant")
         .slice(-1)[0]?.content || "";
           
       if (updatedConversation[userMsgIndex]?.role === "user") {
         scoreUserAnswer(
           updatedConversation[userMsgIndex].content,
           lastAiQuestion,
           userMsgIndex
         );
       }
    } catch (error) {
      console.error("Interview error:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "Something went wrong. Please check the backend and try again.",
      };
      setConversation([...updatedConversation, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  const scoreUserAnswer = async (
  userMessage: string,
  aiQuestion: string,
  messageIndex: number
) => {
  const wordCount = userMessage.trim().split(/\s+/).length;
  if (wordCount < 10) return;

  setConversation((prev) => {
    const updated = [...prev];
    if (updated[messageIndex]) {
      updated[messageIndex] = { ...updated[messageIndex], isScoring: true };
    }
    return updated;
  });

  try {
    const [scoreResponse, qualityResponse] = await Promise.all([
      fetch("https://unicorn-backend-3.onrender.com/api/score-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          answer: userMessage,
          job_role: jobRole,
        }),
      }),
      fetch("https://unicorn-backend-3.onrender.com/api/quality-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          answer: userMessage,
          job_role: jobRole,
          job_description: "",
        }),
      }),
    ]);

    const scoreData: StarScore = await scoreResponse.json();
    const qualityData: QualityFeedback = await qualityResponse.json();

    setConversation((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          score: scoreData,
          quality: qualityData,
          isScoring: false,
        };
      }
      return updated;
    });
  } catch (error) {
    console.error("Scoring error:", error);
    setConversation((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex] = { ...updated[messageIndex], isScoring: false };
      }
      return updated;
    });
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    sendMessage(userInput);
  };

  const FILLER_WORDS = ["um", "uh", "basically", "you know", "like", "so", "actually", "literally", "kind of", "sort of"];  const startListening1= () => {

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Browser speech recognition not supported. Use Chrome.");
    return;

  }  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.lang = voiceAccent === "hindi" ? "hi-IN" : "en-IN";  startTimeRef.current = Date.now();


  wordCountRef.current = 0;  recognition.onresult = (event: any) => {

    let interim = "";

    let final = "";    for (let i = event.resultIndex; i < event.results.length; i++) {

      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += text;
        wordCountRef.current += text.trim().split(/\s+/).length;
      } else {
        interim += text;
      }
    }
    const fullText = final || interim;


    setTranscript(fullText);    // Live WPM

    const elapsed = (Date.now() - startTimeRef.current) / 60000;

    if (elapsed > 0) setLiveWPM(Math.round(wordCountRef.current / elapsed));    // Filler word count

    const words = fullText.toLowerCase().split(/\s+/);
    const fillers = words.filter(w => FILLER_WORDS.includes(w));
    setFillerCount(fillers.length);

  };  recognition.onend = () => setIsListening(false);

  recognitionRef.current = recognition;
  recognition.start();
  setIsListening(true);
  setTranscript("");
};

// const stopListeningAndSend = async () => {

//   recognitionRef.current?.stop();

//   setIsListening(false);

//   if (!transcript.trim()) return;

//   setIsLoading(true);  try {

//     // 1. Get AI response
//     const response = await fetch("https://unicorn-backend-3.onrender.com/api/voice-interview", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         transcript,
//         job_role: jobRole,
//         interview_type: interviewType,
//         conversation: conversation.slice(-6),
//         resume_data: resumeData || {},
//         accent: voiceAccent,
//       }),
//     });
//     const data = await response.json();


//     const aiReply = data.reply;    // Update conversation

//     const userMsg: ScoredMessage = { role: "user", content: transcript };
//     const aiMsg: ScoredMessage = { role: "assistant", content: aiReply };
//     setConversation(prev => [...prev, userMsg, aiMsg]);

//     setTranscript("");    // 2. Get TTS audio

//     setIsSpeaking(true);
//     const ttsResponse = await fetch("https://unicorn-backend-3.onrender.com/api/tts", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: aiReply, accent: voiceAccent }),

//     });    const ttsData = await ttsResponse.json();


//     const audioSrc = `data:audio/mp3;base64,${ttsData.audio_base64}`;    if (audioRef.current) {

//       audioRef.current.src = audioSrc;
//       audioRef.current.play();
//       audioRef.current.onended = () => setIsSpeaking(false);

//     }    // Score the answer

//     const lastAiQ = conversation.filter(m => m.role === "assistant").slice(-1)[0]?.content || "";
//     const userIdx = conversation.length;

//     scoreUserAnswer(transcript, lastAiQ, userIdx);  } catch (error) {

//     console.error("Voice error:", error);
//     setIsSpeaking(false);
//   } finally {
//     setIsLoading(false);
//   }
// };
const startListening = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Chrome browser use karo — Safari/Firefox mein Speech API nahi hoti.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;      // ← continuous OFF — mobile ke liye
  recognition.interimResults = true;
  recognition.lang = voiceAccent === "hindi" ? "hi-IN" : "en-IN";

  startTimeRef.current = Date.now();
  wordCountRef.current = 0;
  let finalTranscript = "";

  recognition.onstart = () => {
    setIsListening(true);
    setTranscript("");
    finalTranscript = "";
  };

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += text + " ";
        wordCountRef.current += text.trim().split(/\s+/).length;
      } else {
        interim += text;
      }
    }

    const display = finalTranscript + interim;
    setTranscript(display);

    // Live WPM
    const elapsed = (Date.now() - startTimeRef.current) / 60000;
    if (elapsed > 0) setLiveWPM(Math.round(wordCountRef.current / elapsed));

    // Filler words
    const words = display.toLowerCase().split(/\s+/);
    const fillers = words.filter(w => FILLER_WORDS.includes(w));
    setFillerCount(fillers.length);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech error:", event.error);
    setIsListening(false);
    if (event.error === "not-allowed") {
      alert("Microphone permission do! Browser settings mein jaao → Microphone → Allow");
    }
  };

  // ← YAHI KEY FIX HAI — onend pe automatically submit
  recognition.onend = () => {
    setIsListening(false);
    if (finalTranscript.trim().length > 3) {
      // Auto submit when recording stops
      submitVoiceAnswer(finalTranscript.trim());
    }
  };

  recognitionRef.current = recognition;
  recognition.start();
};

// ← ALAG FUNCTION — submit logic yahan
const submitVoiceAnswer = async (text: string) => {
  if (!text.trim() || isLoading) return;

  setIsLoading(true);
  setTranscript(text);

  try {
    const response = await fetch(
      "https://unicorn-backend-3.onrender.com/api/voice-interview",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          job_role: jobRole,
          interview_type: interviewType,
          conversation: conversation.slice(-6),
          resume_data: resumeData || {},
          accent: voiceAccent,
        }),
      }
    );

    if (!response.ok) throw new Error("Backend error");
    const data = await response.json();
    const aiReply = data.reply;

    const userMsg: ScoredMessage = { role: "user", content: text };
    const aiMsg: ScoredMessage = { role: "assistant", content: aiReply };
    setConversation(prev => [...prev, userMsg, aiMsg]);
    setTranscript("");

    // TTS
    setIsSpeaking(true);
    const ttsResponse = await fetch(
      "https://unicorn-backend-3.onrender.com/api/tts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiReply, accent: voiceAccent }),
      }
    );

    if (ttsResponse.ok) {
      const ttsData = await ttsResponse.json();
      const audioSrc = `data:audio/mp3;base64,${ttsData.audio_base64}`;
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        audioRef.current.onended = () => {
          setIsSpeaking(false);
        };
      }
    } else {
      setIsSpeaking(false);
    }

    // Score answer
    const lastAiQ = conversation
      .filter(m => m.role === "assistant")
      .slice(-1)[0]?.content || "";
    const userIdx = conversation.length;
    scoreUserAnswer(text, lastAiQ, userIdx);

  } catch (error) {
    console.error("Voice submit error:", error);
    setIsSpeaking(false);
  } finally {
    setIsLoading(false);
  }
};

// ← Button click handler — simple toggle
const handleMicClick = () => {
  if (isListening) {
    // Manual stop → onend automatically calls submitVoiceAnswer
    recognitionRef.current?.stop();
  } else {
    startListening();
  }
};
  const generatePrepPack = async () => {
  if (!companyInput.trim()) {
    alert("Company name likho pehle!");
    return;
  }
  setIsPrepLoading(true);
  try {
    const response = await fetch(
      "https://unicorn-backend-3.onrender.com/prep-pack",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: manualRole || jobRole || "Software Engineer",
          company: companyInput.trim(),
          resume_data: resumeData || {},
        }),
      }
    );
    if (!response.ok) throw new Error("Backend error!");
    const data = await response.json();
    setPrepPack(data);
    setShowPrepPack(true);
  } catch (error) {
    console.error("Prep pack error:", error);
    alert("Prep pack generate nahi hua. Retry karo!");
  } finally {
    setIsPrepLoading(false);
  }
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
            {/* Tab Toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "4px", gap: "4px" }}>
            <button
              onClick={() => setActiveTab("interview")}
              style={{
                padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.2s",
                background: activeTab === "interview" ? "#fff" : "transparent",
                color: activeTab === "interview" ? "#030014" : "rgba(255,255,255,0.5)",
              }}>
              🎤 Interview
            </button>
            <button
              onClick={() => setActiveTab("prep")}
              style={{
                padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.2s",
                background: activeTab === "prep" ? "#a78bfa" : "transparent",
                color: activeTab === "prep" ? "#fff" : "rgba(255,255,255,0.5)",
              }}>
              🏢 Prep Pack
            </button>
          </div>
            <button onClick={() => router.push("/")}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "8px 18px", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              ← Back
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT */}
<div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", maxWidth: "820px", width: "100%", margin: "0 auto", padding: "24px 20px", gap: "20px" }}>

  {activeTab === "interview" ? (
    <>
      {/* PRE-START SCREEN */}
      {!interviewStarted && (
        <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "36px", animation: "fadeInUp 0.4s ease" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
            Ready for your Mock Interview? 🎯
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "28px", lineHeight: "1.6" }}>
            AI interviewer will ask role-specific questions using STAR method, follow up on your answers, and give you a real interview experience.
          </p>
          {/* Interview Type Selector */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: "12px" }}>
                🎯 Interview Type Select Karo:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {interviewTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setInterviewType(type.id)}
                    style={{
                      padding: "12px 10px",
                      borderRadius: "12px",
                      border: `1px solid ${interviewType === type.id ? type.color : "rgba(255,255,255,0.06)"}`,
                      background: interviewType === type.id ? `${type.color}18` : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>{type.icon}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: interviewType === type.id ? type.color : "rgba(255,255,255,0.7)", marginBottom: "2px" }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", lineHeight: "1.4" }}>
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
          {/* Role badge
          <div style={{ textAlign: "center" }}>
            <span style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}>
              Interviewing for: {jobRole}
            </span>
          </div> */}
          {/* Role + Type badge */}
            <div style={{ textAlign: "center", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}>
                Interviewing for: {jobRole}
              </span>
              <span style={{
                background: `${interviewTypes.find(t => t.id === interviewType)?.color}18`,
                border: `1px solid ${interviewTypes.find(t => t.id === interviewType)?.color}40`,
                borderRadius: "999px", padding: "6px 16px", fontSize: "12px", fontWeight: 600,
                color: interviewTypes.find(t => t.id === interviewType)?.color
              }}>
                {interviewTypes.find(t => t.id === interviewType)?.icon} {interviewTypes.find(t => t.id === interviewType)?.label}
              </span>
            </div>

          {/* Messages */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minHeight: "400px" }}>
            {/* {conversation
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
              ))} */}
              {conversation
            .filter((msg) => msg.content !== "Hello, I'm ready to start the interview.")
            .map((msg, i) => (
              <div key={i} className="msg-bubble" style={{ display: "flex", flexDirection: "column" }}>

                {/* Message bubble row */}
                <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
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
                
                {/* STAR Score — sirf user messages ke neeche */}
                {msg.role === "user" && msg.isScoring && (
                  <div style={{ alignSelf: "flex-start", marginLeft: "42px", marginTop: "8px", color: "#a78bfa", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Scoring your answer...
                  </div>
                )}
                {msg.role === "user" && msg.score && (
                  <div style={{ alignSelf: "flex-start", width: "80%", marginLeft: "42px", marginTop: "8px" }}>
                    <StarScoreCard score={msg.score} quality={msg.quality} />
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

          {/* Input box
          <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your answer here... (Enter to send, Shift+Enter for new line)"
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
          </div> */}
          {/* Voice / Text Mode Toggle */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
              <button onClick={() => setIsVoiceMode(false)}
                style={{ padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: !isVoiceMode ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.03)",
                  borderColor: !isVoiceMode ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)",
                  color: !isVoiceMode ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>
                ⌨️ Text
              </button>
              <button onClick={() => setIsVoiceMode(true)}
                style={{ padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: isVoiceMode ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
                  borderColor: isVoiceMode ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)",
                  color: isVoiceMode ? "#34d399" : "rgba(255,255,255,0.5)" }}>
                🎤 Voice
              </button>
            </div>
                
            {/* Accent selector */}
            {isVoiceMode && (
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "12px" }}>
                {[
                  { id: "indian", label: "🇮🇳 Indian" },
                  { id: "american", label: "🇺🇸 American" },
                  { id: "british", label: "🇬🇧 British" },
                  { id: "hindi", label: "🔵 Hindi" },
                ].map(a => (
                  <button key={a.id} onClick={() => setVoiceAccent(a.id)}
                    style={{ padding: "5px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, border: "1px solid", cursor: "pointer",
                      background: voiceAccent === a.id ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.02)",
                      borderColor: voiceAccent === a.id ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.06)",
                      color: voiceAccent === a.id ? "#06b6d4" : "rgba(255,255,255,0.4)" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* VOICE MODE UI */}
            {isVoiceMode ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px", background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}>
              
                {/* Live metrics */}
                <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
                  <span style={{ color: liveWPM > 160 ? "#f87171" : liveWPM > 0 ? "#34d399" : "rgba(255,255,255,0.3)" }}>
                    ⚡ {liveWPM} WPM
                  </span>
                  <span style={{ color: fillerCount > 3 ? "#f87171" : fillerCount > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                    🚫 {fillerCount} fillers
                  </span>
                  <span style={{ color: isSpeaking ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>
                    🔊 {isSpeaking ? "AI speaking..." : "Ready"}
                  </span>
                </div>
            
                {/* Mic button */}
                <button
                  onClick={handleMicClick}
                  disabled={isSpeaking || isLoading}
                  style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: isListening ? "rgba(239,68,68,0.2)" : "rgba(167,139,250,0.15)",
                    border: `2px solid ${isListening ? "#ef4444" : "#a78bfa"}`,
                    cursor: isSpeaking || isLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "32px", transition: "all 0.2s",
                    boxShadow: isListening ? "0 0 0 8px rgba(239,68,68,0.1)" : "none",
                  }}>
                  {isListening ? "⏹" : "🎤"}
                </button>
                
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                  {isListening ? "Bol raha hai... ruko phir stop karo" : isSpeaking ? "AI bol raha hai..." : "Mic dabao aur jawab do"}
                </p>
                
                {/* Live transcript */}
                {transcript && (
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", minHeight: "60px" }}>
                    {transcript}
                  </div>
                )}
              </div>
            ) : (
              /* TEXT INPUT — same as before */
              <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Enter your answer here... (Enter to send, Shift+Enter for new line)"
                  disabled={isLoading} rows={3}
                  style={{ flex: 1, background: "transparent", border: "none", color: "#f1f5f9", fontSize: "14px", resize: "none", lineHeight: "1.6", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}/>
                <button onClick={handleSubmit} disabled={isLoading || !userInput.trim()} className="send-btn"
                  style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(167,139,250,0.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            )}
            
            {/* Hidden audio element */}
            <audio ref={audioRef} style={{ display: "none" }} />
        </>
      )}
    </>
  ) : (
    /* ===================== PREP PACK TAB ===================== */
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Company Input Card */}
      {!showPrepPack && (
        <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "36px", animation: "fadeInUp 0.4s ease" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
            Company-Specific Prep Pack 🏢
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "28px", lineHeight: "1.6" }}>
            Enter company name — AI will generate culture insights, interview process, real questions, and insider tips tailored to your role.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: "8px" }}>Company Name</label>
            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="e.g. Google, Microsoft, Flipkart, Swiggy, TCS..."
              onKeyDown={(e) => e.key === "Enter" && generatePrepPack()}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "14px", outline: "none" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(167,139,250,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          {(manualRole || jobRole) && (
            <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              🎯 Role: <strong style={{ color: "#a78bfa" }}>{manualRole || jobRole}</strong>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
            {[
              { icon: "🏛️", text: "Company culture & values" },
              { icon: "🔄", text: "Exact interview process" },
              { icon: "💡", text: "Real question patterns" },
              { icon: "⚡", text: "Insider tips & red flags" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={generatePrepPack} disabled={isPrepLoading || !companyInput.trim()}
            style={{ width: "100%", height: "52px", borderRadius: "999px", background: isPrepLoading ? "rgba(167,139,250,0.4)" : "#a78bfa", color: "#fff", fontWeight: 800, fontSize: "15px", border: "none", cursor: isPrepLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
            {isPrepLoading ? "⚡ Generating Prep Pack..." : "🚀 Generate Prep Pack"}
          </button>
        </div>
      )}

      {/* PREP PACK RESULT */}
      {showPrepPack && prepPack && (
        <div style={{ animation: "fadeInUp 0.4s ease" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(6,182,212,0.1))", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                {prepPack.company} — {prepPack.role}
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                {prepPack.interview_process.total_rounds} • {prepPack.interview_process.timeline}
              </p>
            </div>
            <button onClick={() => { setShowPrepPack(false); setCompanyInput(""); setPrepPack(null); }}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 14px", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              🔄 New Search
            </button>
          </div>

          {/* Section Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { id: "culture", label: "🏛️ Culture" },
              { id: "process", label: "🔄 Process" },
              { id: "technical", label: "💻 Technical" },
              { id: "behavioral", label: "🧠 Behavioral" },
              { id: "tips", label: "⚡ Tips" },
              { id: "timeline", label: "📅 Timeline" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setPrepActiveSection(tab.id)}
                style={{
                  padding: "8px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                  border: "1px solid", cursor: "pointer", transition: "all 0.2s",
                  background: prepActiveSection === tab.id ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.03)",
                  borderColor: prepActiveSection === tab.id ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)",
                  color: prepActiveSection === tab.id ? "#a78bfa" : "rgba(255,255,255,0.5)",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          <div style={{ background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>

            {/* CULTURE */}
            {prepActiveSection === "culture" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.7" }}>{prepPack.culture.summary}</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{prepPack.culture.work_style}</p>
                <div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Core Values</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {prepPack.culture.values.map((v, i) => (
                      <span key={i} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "999px", padding: "6px 14px", fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Key Technologies</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {prepPack.key_technologies.map((t, i) => (
                      <span key={i} style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "999px", padding: "6px 14px", fontSize: "12px", color: "#06b6d4", fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PROCESS */}
            {prepActiveSection === "process" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {prepPack.interview_process.rounds.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#a78bfa" }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{r.round}</p>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: "999px" }}>{r.duration}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{r.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TECHNICAL */}
            {prepActiveSection === "technical" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {prepPack.technical_questions.map((q, i) => (
                  <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      {q.category && <span style={{ fontSize: "11px", background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)", padding: "3px 10px", borderRadius: "999px", fontWeight: 600 }}>{q.category}</span>}
                      {q.difficulty && <span style={{ fontSize: "11px", background: q.difficulty === "Hard" ? "rgba(239,68,68,0.1)" : q.difficulty === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", color: q.difficulty === "Hard" ? "#ef4444" : q.difficulty === "Medium" ? "#f59e0b" : "#10b981", border: `1px solid ${q.difficulty === "Hard" ? "rgba(239,68,68,0.2)" : q.difficulty === "Medium" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`, padding: "3px 10px", borderRadius: "999px", fontWeight: 600 }}>{q.difficulty}</span>}
                    </div>
                    <p style={{ fontSize: "14px", color: "#f1f5f9", fontWeight: 600, marginBottom: "8px", lineHeight: "1.5" }}>{q.question}</p>
                    {q.tip && <p style={{ fontSize: "12px", color: "rgba(167,139,250,0.7)", lineHeight: "1.6" }}>💡 {q.tip}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* BEHAVIORAL */}
            {prepActiveSection === "behavioral" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {prepPack.behavioral_questions.map((q, i) => (
                  <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {q.focus_area && <span style={{ fontSize: "11px", background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)", padding: "3px 10px", borderRadius: "999px", fontWeight: 600, display: "inline-block", marginBottom: "8px" }}>{q.focus_area}</span>}
                    <p style={{ fontSize: "14px", color: "#f1f5f9", fontWeight: 600, lineHeight: "1.5" }}>{q.question}</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>Use STAR method: Situation → Task → Action → Result</p>
                  </div>
                ))}
              </div>
            )}

            {/* TIPS */}
            {prepActiveSection === "tips" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>✅ Insider Tips</p>
                  {prepPack.company_specific_tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i < prepPack.company_specific_tips.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ color: "#10b981", fontSize: "16px", marginTop: "1px" }}>→</span>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{tip}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>🚫 Red Flags to Avoid</p>
                  {prepPack.red_flags_to_avoid.map((flag, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i < prepPack.red_flags_to_avoid.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ color: "#ef4444", fontSize: "16px", marginTop: "1px" }}>✗</span>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{flag}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIMELINE */}
            {prepActiveSection === "timeline" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { week: "Week 1", content: prepPack.preparation_timeline.week1, color: "#10b981" },
                  { week: "Week 2", content: prepPack.preparation_timeline.week2, color: "#a78bfa" },
                  { week: "Week 3", content: prepPack.preparation_timeline.week3, color: "#06b6d4" },
                ].map((w, i) => (
                  <div key={i} style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: `1px solid ${w.color}22`, borderLeft: `3px solid ${w.color}` }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: w.color, marginBottom: "8px" }}>{w.week}</p>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{w.content}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
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
function StarScoreCard({ score, quality }: { score: StarScore; quality?: QualityFeedback }) {
  const [showIdeal, setShowIdeal] = useState(false);
  const [activeTab, setActiveTab] = useState<"star" | "quality">("star");

  const verdictColor = {
    Excellent: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
    Good: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#a78bfa" },
    Average: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
    "Needs Work": { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "#f87171" },
  }[score.verdict];

  const starKeys = ["situation", "task", "action", "result"] as const;
  const starLabels = {
    situation: "S — Situation",
    task: "T — Task",
    action: "A — Action",
    result: "R — Result"
  };

  const getBarColor = (pct: number) =>
    pct >= 80 ? "#34d399" : pct >= 60 ? "#a78bfa" : pct >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ marginTop: "10px", background: "rgba(5,3,15,0.9)", border: `1px solid ${verdictColor.border}`, borderRadius: "14px", overflow: "hidden", fontSize: "13px" }}>

      {/* Tab Header */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => setActiveTab("star")}
          style={{ flex: 1, padding: "10px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === "star" ? "rgba(167,139,250,0.12)" : "transparent", color: activeTab === "star" ? "#a78bfa" : "rgba(255,255,255,0.35)", borderBottom: activeTab === "star" ? "2px solid #a78bfa" : "2px solid transparent" }}>
          ⭐ STAR Score — {score.total_score}/100
        </button>
        <button onClick={() => setActiveTab("quality")}
          style={{ flex: 1, padding: "10px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s", background: activeTab === "quality" ? "rgba(6,182,212,0.1)" : "transparent", color: activeTab === "quality" ? "#06b6d4" : "rgba(255,255,255,0.35)", borderBottom: activeTab === "quality" ? "2px solid #06b6d4" : "2px solid transparent" }}>
          📊 Quality — {quality ? `${quality.overall_quality}/100` : "..."}
        </button>
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── STAR TAB ── */}
        {activeTab === "star" && (
          <>
            {/* Verdict badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ color: verdictColor.text, fontWeight: 700, fontSize: "11px", background: verdictColor.bg, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${verdictColor.border}` }}>
                {score.verdict}
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: verdictColor.text }}>
                {score.total_score}<span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>/100</span>
              </span>
            </div>

            {/* STAR bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
              {starKeys.map((key) => {
                const item = score.breakdown[key];
                const pct = (item.score / item.max) * 100;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{starLabels[key]}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: getBarColor(pct) }}>{item.score}/{item.max}</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", marginBottom: "3px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: getBarColor(pct), borderRadius: "99px" }} />
                    </div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{item.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Weak areas */}
            {score.weak_areas.length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", marginBottom: "6px" }}>⚠ Improve karo:</p>
                {score.weak_areas.map((area, i) => (
                  <p key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "2px 0" }}>• {area}</p>
                ))}
              </div>
            )}

            {/* Ideal answer */}
            <button onClick={() => setShowIdeal(!showIdeal)}
              style={{ width: "100%", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "8px", padding: "8px", color: "#a78bfa", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {showIdeal ? "▲ Hide Ideal Answer" : "✦ Show Ideal Answer"}
            </button>
            {showIdeal && (
              <div style={{ marginTop: "10px", background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "10px", padding: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#a78bfa", marginBottom: "8px" }}>💡 Ideal Answer:</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7", margin: 0 }}>{score.ideal_answer}</p>
              </div>
            )}
          </>
        )}

        {/* ── QUALITY TAB ── */}
        {activeTab === "quality" && quality && (
          <>
            {/* One line verdict */}
            <div style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "#06b6d4", margin: 0, lineHeight: "1.5" }}>
                💬 {quality.one_line_verdict}
              </p>
            </div>

            {/* 4 dimension bars */}
            {[
              { label: "🎯 Clarity", score: quality.clarity.score, sublabel: quality.clarity.label, feedback: quality.clarity.feedback },
              { label: "🔗 Relevance", score: quality.relevance.score, sublabel: quality.relevance.label, feedback: quality.relevance.feedback },
              { label: "📏 Length", score: quality.length.score, sublabel: quality.length.label, feedback: quality.length.feedback },
              { label: "💪 Confidence", score: quality.confidence.score, sublabel: quality.confidence.label, feedback: quality.confidence.feedback },
            ].map((dim, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                    {dim.label} <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>— {dim.sublabel}</span>
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: getBarColor(dim.score) }}>{dim.score}/100</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", marginBottom: "3px" }}>
                  <div style={{ height: "100%", width: `${dim.score}%`, background: getBarColor(dim.score), borderRadius: "99px" }} />
                </div>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{dim.feedback}</p>
              </div>
            ))}

            {/* Filler words */}
            {quality.filler_words.count > 0 && (
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", marginBottom: "6px" }}>
                  🚫 Filler Words Detected ({quality.filler_words.count})
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {quality.filler_words.detected.map((w, i) => (
                    <span key={i} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", color: "#f87171", fontWeight: 600 }}>
                      "{w}"
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{quality.filler_words.feedback}</p>
              </div>
            )}

            {/* Missing keywords */}
            {quality.missing_keywords.words.length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px", padding: "10px 12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", marginBottom: "6px" }}>
                  🔑 Missing Keywords
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {quality.missing_keywords.words.map((w, i) => (
                    <span key={i} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", color: "#fbbf24", fontWeight: 600 }}>
                      {w}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{quality.missing_keywords.feedback}</p>
              </div>
            )}
          </>
        )}

        {/* Quality loading */}
        {activeTab === "quality" && !quality && (
          <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
            📊 Quality analysis loading...
          </div>
        )}
      </div>
    </div>
  );
}