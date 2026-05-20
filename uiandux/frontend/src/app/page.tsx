"use client";

import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
// import html2pdf from "html2pdf.js";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
// Firebase auth aur provider ko import kar rahe hain login process ke liye
import { auth, googleProvider,db } from "../../firebase"; // path check kar lena agar file kisi folder mein hai toh
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
// import { db } from "../../firebase"; // apna path check karo
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

// ==========================================
// TYPES & INTERFACES
// ==========================================
type AppState = "idle" | "loading" | "done";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: string;
  delay: string;
  duration: string;
}

interface ExperienceItem {
  role: string;
  duration: string;
  points: string[];
}

interface ProjectItem {
  name: string;
  points: string[];
}

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

// Updated to match the upgraded backend schema
interface ResumeData {
  name: string;
  contact: string;
  summary: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  education: EducationItem[];
  ats_score: string;
}

// DEFAULT PLACEHOLDER DATA
const DEFAULT_RESUME: ResumeData = {
  name: "Alex Chen",
  contact: "483-555-6580  •  alex@chen.dev  •  linkedin.com/in/alexchen",
  summary:
    "Results-driven Senior Software Engineer with 5+ years building scalable distributed systems. Passionate about clean architecture and shipping pristine production systems.",
  experience: [
    {
      role: "Senior Software Engineer @ TechCorp",
      duration: "2021 – 2022",
      points: [
        "Architected migration of monolithic backend to microservices, reducing p99 latency by 40%.",
        "Engineered real-time data pipeline handling 50K events/sec using Kafka and Node.js.",
      ],
    },
  ],
  projects: [
    {
      name: "E-Commerce Platform (Node.js, React, MySQL)",
      points: [
        "Designed normalized MySQL schema supporting 10K+ concurrent product queries.",
        "Implemented JWT-based auth reducing unauthorized access by 95%.",
      ],
    },
  ],
  skills: [
    "Languages: JavaScript, TypeScript, SQL",
    "Backend: Node.js, Express.js, REST APIs, FastAPI",
    "Frontend: React, Tailwind CSS",
    "Databases: PostgreSQL, MongoDB",
    "Tools: Git, Docker, Postman",
  ],
  education: [
    {
      degree: "B.Tech in Computer Science",
      institution: "State University of Technology",
      year: "Expected 2025",
    },
  ],
  ats_score: "91% — Strong keyword alignment with JD and quantified achievements throughout.",
};

// ==========================================
// THE EXACT DESIGN SPEC CSS
// ==========================================
const exactDesignStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: #030014;
    color: #f3f4f6;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow-x: hidden;
  }

  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

  @keyframes cosmicGlow {
    0%, 100% { opacity: 0.45; transform: scale(1) translateY(0px) rotate(0deg); }
    50% { opacity: 0.65; transform: scale(1.08) translateY(-15px) rotate(3deg); }
  }
  @keyframes floatingStars {
    0% { transform: translateY(0) scale(1); opacity: 0.1; }
    50% { opacity: 0.7; }
    100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
  }
  @keyframes inputBorderNeon {
    0%, 100% { border-color: rgba(167,139,250,0.25); box-shadow: 0 0 0 1px rgba(167,139,250,0.1); }
    50% { border-color: rgba(6,182,212,0.4); box-shadow: 0 0 15px rgba(6,182,212,0.15); }
  }
  @keyframes laserSweep {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulseBadge {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
  }
  @keyframes skeletonFlow {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .workspace-container {
    display: grid;
    grid-template-columns: 1.1fr 1.3fr;
    gap: 28px;
    padding: 0 40px 40px;
    height: calc(100vh - 90px);
    position: relative;
    z-index: 5;
  }

  @media (max-width: 1024px) {
    .workspace-container {
      grid-template-columns: 1fr;
      height: auto;
      overflow-y: visible;
    }
  }
`;

export default function AIResumeArchitect() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [profileData, setProfileData] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // TARGET 3: NEW STATES FOR AI EDIT
  const [editInstruction, setEditInstruction] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // User ki login state check karne ke liye state variables
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Shuruat mein loading true rahegi
  const router = useRouter();

  // BACKEND CONNECTIVITY — unchanged
  const handleGenerate = async () => {
    if (!profileData || !jobDescription) {
      alert("Bhai, raw profile aur JD dono fill karo pehle!");
      return;
    }
    setAppState("loading");
    try {
      const response = await fetch("https://unicorn-backend-2.onrender.com/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileData, jd: jobDescription }),
      });
      if (!response.ok) throw new Error("Backend server error!");
      const result = await response.json();
      const inputChars = profileData.length + jobDescription.length;
      const outputChars = JSON.stringify(result).length;
      const roughTokens = Math.ceil((inputChars + outputChars) / 4);
      setTokensUsed(roughTokens);
      setResumeData(result);
      // Resume generate hone ke baad Firestore mein save karo
try {
  const user = auth.currentUser; // auth tumhare firebase.ts se import karo
  if (user) {
    await addDoc(collection(db, "resumes"), {
      userId: user.uid,
      jobTitle: jobDescription.split("\n")[0].slice(0, 60), // JD ki pehli line as title
      createdAt: serverTimestamp(),
      profileInput: profileData,
      jdInput: jobDescription,
      resumeData: result,
      tokenCount:roughTokens, // jo Feature 1 mein banaya tha
    });
    console.log("History saved!");
  }
} catch (error) {
  console.error("History save nahi hua:", error);
  // Error aaye toh bhi resume generation fail mat karo — silently handle karo
}
      setAppState("done");
    } catch (error) {
      console.error("Error calling API:", error);
      alert("Backend se connection fail ho gaya. Check karo backend chal raha hai ya nahi.");
      setAppState("idle");
    }
  };

  // TARGET 3: HANDLE AI EDIT FUNCTION
  const handleEditResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInstruction.trim() || !resumeData) return;

    setIsEditing(true);
    try {
      const response = await fetch("https://unicorn-backend-2.onrender.com/api/edit-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentResume: resumeData,
          instruction: editInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend se response sahi nahi mila!");
      }

      const data = await response.json();
      setResumeData(data); // Screen par resume data update ho jayega dynamically
      setEditInstruction(""); // Chat field clear karo
    } catch (error) {
      console.error("Error editing resume:", error);
      alert("Kuch gadbad hui edit karte waqt. Firse try karein!");
    } finally {
      setIsEditing(false);
    }
  };
  // Google Login Popup trigger karne ka function
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Bhai, kamyaabi se login ho gaye ho!");
    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login mein kuch dikkat aayi: " + error.message);
    }
  };

  // Logout karne ka function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Log out ho gaya!");
    } catch (error: any) {
      console.error("Logout Error:", error);
    }
  };
  // PDF EXPORT FUNCTION
  const downloadPDF = async () => {
    const element = document.getElementById("resume-content-area");
    if (!element) return;
    const html2pdf = (await import("html2pdf.js")).default;

    const fileName = currentResume?.name ? `${currentResume.name.replace(/\s+/g, '_')}_Resume.pdf` : 'Resume.pdf';

    const opt: any = {
      margin:       [10, 10, 10, 10],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  // WORD (DOCX) EXPORT FUNCTION
  const downloadWord = () => {
    if (!currentResume) return;

    const fileName = currentResume?.name ? `${currentResume.name.replace(/\s+/g, '_')}_Resume.docx` : 'Resume.docx';

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: currentResume.name || "Name", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: currentResume.contact || "", spacing: { after: 200 } }),
          
          new Paragraph({ text: "PROFESSIONAL SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          new Paragraph({ text: currentResume.summary || "", spacing: { after: 200 } }),
          
          new Paragraph({ text: "EXPERIENCE", heading: HeadingLevel.HEADING_2 }),
          ...(currentResume.experience || []).flatMap(exp => [
            new Paragraph({ text: `${exp.role}   (${exp.duration})`, heading: HeadingLevel.HEADING_3 }),
            ...(exp.points || []).map(pt => new Paragraph({ text: `• ${pt}`, indent: { left: 360 } }))
          ]),

          new Paragraph({ text: "PROJECTS", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          ...(currentResume.projects || []).flatMap(proj => [
            new Paragraph({ text: proj.name, heading: HeadingLevel.HEADING_3 }),
            ...(proj.points || []).map(pt => new Paragraph({ text: `• ${pt}`, indent: { left: 360 } }))
          ]),

          new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          ...(currentResume.skills || []).map(skill => new Paragraph({ text: skill })),

          new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          ...(currentResume.education || []).map(edu => 
            new Paragraph({ text: `${edu.degree} - ${edu.institution} (${edu.year})` })
          )
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        delay: `${Math.random() * 6}s`,
        duration: `${Math.random() * 12 + 10}s`,
      }))
    );
  }, []);
  // Yeh effect check karega ki user logged in hai ya nahi, jab bhi page load hoga
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false); // Check hone ke baad loading band
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const currentResume = resumeData || DEFAULT_RESUME;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: exactDesignStyles }} />

      {/* GRADIENT BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, backgroundColor: "#04020d", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "60vw", height: "60vh", background: "radial-gradient(circle, rgba(91,33,182,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50vw", height: "50vh", background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "-10%", width: "120%", height: "320px", background: "linear-gradient(90deg, transparent, rgba(147,51,234,0.25) 20%, rgba(6,182,212,0.28) 50%, rgba(236,72,153,0.18) 80%, transparent)", filter: "blur(70px) contrast(1.2)", transform: "skewY(-6deg)", animation: "cosmicGlow 10s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {particles.map((p) => (
            <div key={p.id} style={{ position: "absolute", borderRadius: "50%", backgroundColor: "#fff", left: p.left, top: p.top, width: p.size, height: p.size, animation: `floatingStars ${p.duration} linear ${p.delay} infinite` }} />
          ))}
        </div>
      </div>

      {/* VIEWPORT LAYER */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* NAV BAR
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(167,139,250,0.5)" }}>
              <span style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>✦</span>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px", background: "linear-gradient(to right, #ffffff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI Resume Architect
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "8px 18px", display: "flex", alignItems: "center", gap: "10px", backdropFilter: "blur(10px)" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulseBadge 2s infinite" }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: "0.3px" }}>CrewAI Powered</span>
          </div>
        </nav> */}
        {/* NAV BAR (UPDATED WITH TARGET 4 AUTH BUTTONS) */}
<nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "relative" }}>
  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(167,139,250,0.5)" }}>
      <span style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>✦</span>
    </div>
    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px", background: "linear-gradient(to right, #ffffff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      AI Resume Architect
    </span>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "8px 18px", display: "flex", alignItems: "center", gap: "10px", backdropFilter: "blur(10px)" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulseBadge 2s infinite" }} />
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: "0.3px" }}>CrewAI Powered</span>
    </div>
   <button onClick={() => router.push("/history")}
  style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "999px", padding: "8px 18px",
    color: "rgba(255,255,255,0.7)", fontSize: "12px",
    fontWeight: 600, cursor: "pointer"
  }}>
  📋 History
</button>
<button
  onClick={() => {
    localStorage.setItem("interviewResume", JSON.stringify(resumeData));
    router.push("/interview");
  }}
  style={{
    background: "rgba(16,185,129,0.15)",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#34d399",
    fontSize: "12px",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s"
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.28)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.15)"}
>
  🎤 Mock Interview
</button>

    {/* TARGET 4: DYNAMIC AUTH UI BUTTON */}
    <div style={{ display: "flex", alignItems: "center" }}>
      {authLoading ? (
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Checking Auth...</span>
      ) : user ? (
        // UI when User is Logged In
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: "99px" }}>
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User"} 
              style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)" }}
            />
          )}
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.displayName}
          </span>
          <button 
            onClick={handleLogout}
            style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
          >
            Logout
          </button>
        </div>
      ) : (
        // UI when User is Logged Out (Show Google Login Button)
        <button
          onClick={handleGoogleLogin}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", color: "#030014", fontWeight: 700, padding: "10px 18px", borderRadius: "99px", fontSize: "13px", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,255,255,0.1)", transition: "all 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Login with Google
        </button>
      )}
    </div>
  </div>
</nav>

        {/* WORKSPACE */}
        <main className="workspace-container">

          {/* LEFT PANEL */}
          <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", paddingRight: "4px" }}>

            {/* Profile Input */}
            <div style={{ background: "rgba(10,7,24,0.45)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", backdropFilter: "blur(24px)", padding: "24px", transition: "border-color 0.3s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: "16px", height: "16px", color: "#06b6d4" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Raw Profile Data</h2>
              </div>
              <textarea value={profileData} onChange={(e) => setProfileData(e.target.value)}
                placeholder="Apne baare mein sab likh do (Skills, Projects, Education, Experience)..."
                className="custom-scroll"
                style={{ width: "100%", height: "160px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", color: "#f3f4f6", fontSize: "14px", padding: "16px", outline: "none", resize: "none", lineHeight: "1.6" }}
                onFocus={(e) => (e.target.style.animation = "inputBorderNeon 3s infinite")}
                onBlur={(e) => { e.target.style.animation = "none"; e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
              />
            </div>

            {/* JD Input */}
            <div style={{ background: "rgba(10,7,24,0.45)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", backdropFilter: "blur(24px)", padding: "24px", transition: "border-color 0.3s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: "16px", height: "16px", color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Target Job Description</h2>
              </div>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Jis job ke liye apply karna hai, uska JD yahan paste karo..."
                className="custom-scroll"
                style={{ width: "100%", height: "160px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", color: "#f3f4f6", fontSize: "14px", padding: "16px", outline: "none", resize: "none", lineHeight: "1.6" }}
                onFocus={(e) => (e.target.style.animation = "inputBorderNeon 3s infinite")}
                onBlur={(e) => { e.target.style.animation = "none"; e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
              />
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={appState === "loading"}
              style={{ width: "100%", height: "56px", borderRadius: "999px", background: "#ffffff", color: "#030014", fontWeight: 800, fontSize: "15px", border: "none", cursor: appState === "loading" ? "not-allowed" : "pointer", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(255,255,255,0.07)", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
              onMouseEnter={(e) => { if (appState !== "loading") { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(167,139,250,0.4), 0 10px 30px rgba(6,182,212,0.3)"; } }}
              onMouseLeave={(e) => { if (appState !== "loading") { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(255,255,255,0.07)"; } }}>
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)", backgroundSize: "200% 100%", animation: "laserSweep 3s linear infinite" }} />
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {appState === "loading" ? (
                  <>
                    <svg style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Elite Resume...
                  </>
                ) : (
                  "✦ Generate Elite Resume"
                )}
              </span>
            </button>

            {/* TOKEN COUNTER */}
            {tokensUsed !== null && appState === "done" && (
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa", background: "rgba(10,7,24,0.6)", border: "1px solid rgba(16,185,129,0.2)", padding: "8px 16px", borderRadius: "99px", width: "max-content", margin: "16px auto 0" }}>
                <span style={{ display: "flex", position: "relative", width: "8px", height: "8px" }}>
                  <span style={{ animation: "pulseBadge 2s infinite", position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#10b981", opacity: 0.7 }}></span>
                  <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                </span>
                <span>Estimated Token Usage: <strong style={{ color: "#10b981" }}>{tokensUsed} tokens</strong></span>
              </div>
            )}
          </div>

          {/* RIGHT PANEL (PREVIEW) */}
          <div className="custom-scroll" style={{ background: "rgba(10,7,24,0.45)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", height: "100%", position: "relative", overflowY: "auto" }}>
            
            {/* MODIFIED HEADER WITH DOWNLOAD BUTTONS */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: "16px", height: "16px", color: "#a78bfa" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>Final Optimized Resume</h2>
              </div>

              {/* Action Buttons */}
              {appState === "done" && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={downloadPDF} 
                    style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#c084fc", fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }} 
                    onMouseEnter={(e)=>e.currentTarget.style.background="rgba(167,139,250,0.25)"} 
                    onMouseLeave={(e)=>e.currentTarget.style.background="rgba(167,139,250,0.15)"}
                  >
                    📥 PDF
                  </button>
                  <button 
                    onClick={downloadWord} 
                    style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee", fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }} 
                    onMouseEnter={(e)=>e.currentTarget.style.background="rgba(6,182,212,0.25)"} 
                    onMouseLeave={(e)=>e.currentTarget.style.background="rgba(6,182,212,0.15)"}
                  >
                    📝 Word
                  </button>
                </div>
              )}
            </div>

            {/* TARGET 3: AI PROMPT EDIT BOX */}
            {appState === "done" && resumeData && (
              <form onSubmit={handleEditResume} style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Bhai, summary choti kar de / React JS jod de..."
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  disabled={isEditing}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(255, 255, 255, 0.03)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isEditing || !editInstruction.trim()}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    background: isEditing ? "#555" : "#a78bfa",
                    color: "#030014",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: isEditing ? "not-allowed" : "pointer",
                    border: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {isEditing ? "Editing..." : "Ask AI to Edit"}
                </button>
              </form>
            )}

            <div style={{ flex: 1, position: "relative" }}>

              {/* LOADING SKELETON */}
              {appState === "loading" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "8px", animation: "fadeInUp 0.3s ease both" }}>
                  <SkeletonWireframe width="40%" height="24px" align="center" />
                  <SkeletonWireframe width="65%" height="10px" align="center" />
                  <div style={{ marginTop: "14px" }}>
                    <SkeletonWireframe width="20%" height="9px" />
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0 12px 0" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <SkeletonWireframe width="100%" height="10px" />
                      <SkeletonWireframe width="94%" height="10px" />
                      <SkeletonWireframe width="78%" height="10px" />
                    </div>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <SkeletonWireframe width="15%" height="9px" />
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0 12px 0" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {[75, 90, 60, 85, 70].map((w, i) => (
                        <SkeletonWireframe key={i} width={`${w}px`} height="24px" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* RESUME PREVIEW */
                <div id="resume-content-area" className="custom-scroll" style={{
                  background: "#ffffff", borderRadius: "14px", padding: "40px 45px",
                  color: "#1e293b", width: "100%", maxWidth: "794px",
                  marginLeft: "auto", marginRight: "auto",
                  overflowY: "auto",
                  boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
                  opacity: appState === "idle" ? 0.6 : 1,
                  transition: "all 0.5s ease",
                  animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
                  position: "relative"
                }}>

                  {/* PREVIEW BADGE */}
                  {appState === "idle" && (
                    <div style={{ position: "absolute", top: "15px", right: "20px", background: "#6366f1", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>
                      PREVIEW PLACEHOLDER
                    </div>
                  )}

                  {/* NAME & CONTACT */}
                  <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                      {currentResume.name}
                    </h1>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 500 }}>
                      {currentResume.contact}
                    </p>
                  </div>

                  <Divider />

                  {/* SUMMARY */}
                  <SectionHeading title="Professional Summary" />
                  <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.65" }}>
                    {currentResume.summary}
                  </p>

                  <Divider />

                  {/* EXPERIENCE */}
                  <SectionHeading title="Experience" />
                  {currentResume.experience.map((exp, i) => (
                    <div key={i} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{exp.role}</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>{exp.duration}</span>
                      </div>
                      <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#334155", lineHeight: "1.6" }}>
                        {exp.points.map((pt, j) => (
                          <li key={j} style={{ marginBottom: "4px" }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* PROJECTS */}
                  {currentResume.projects && currentResume.projects.length > 0 && (
                    <>
                      <Divider />
                      <SectionHeading title="Projects" />
                      {currentResume.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: "16px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "4px" }}>
                            {proj.name}
                          </span>
                          <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#334155", lineHeight: "1.6" }}>
                            {proj.points.map((pt, j) => (
                              <li key={j} style={{ marginBottom: "4px" }}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}

                  <Divider />

                  {/* SKILLS */}
                  <SectionHeading title="Skills" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {currentResume.skills.map((skill, i) => (
                      <p key={i} style={{ fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          {skill.includes(":") ? skill.split(":")[0] + ":" : ""}
                        </span>
                        {skill.includes(":") ? skill.split(":").slice(1).join(":") : skill}
                      </p>
                    ))}
                  </div>

                  {/* EDUCATION */}
                  {currentResume.education && currentResume.education.length > 0 && (
                    <>
                      <Divider />
                      <SectionHeading title="Education" />
                      {currentResume.education.map((edu, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{edu.degree}</span>
                            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>{edu.institution}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>{edu.year}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ATS SCORE */}
                  {appState === "done" && currentResume.ats_score && (
                    <>
                      <Divider />
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                        <p style={{ fontSize: "11.5px", color: "#166534", fontWeight: 600, lineHeight: "1.4" }}>
                          <strong style={{ color: "#15803d", fontSize: "13px" }}>ATS Audit:</strong> {currentResume.ats_score}
                        </p>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================
function SectionHeading({ title }: { title: string }) {
  return (
    <h2 style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "12px",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      color: "#0f172a",
      marginBottom: "10px"
    }}>
      {title}
    </h2>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />;
}

function SkeletonWireframe({ width, height, align = "left" }: { width: string; height: string; align?: "left" | "center" }) {
  return (
    <div style={{
      width: width,
      height: height,
      alignSelf: align === "center" ? "center" : "flex-start",
      background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 37%, rgba(255,255,255,0.03) 63%)",
      backgroundSize: "400% 100%",
      animation: "skeletonFlow 1.4s ease infinite",
      borderRadius: "6px"
    }} />
  );
}