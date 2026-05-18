

// "use client";

// import React, { useState, useEffect, useRef } from "react";

// // ==========================================
// // TYPES & INTERFACES
// // ==========================================
// type AppState = "idle" | "loading" | "done";

// interface Particle {
//   id: number;
//   left: string;
//   top: string;
//   size: string;
//   delay: string;
//   duration: string;
// }

// // Dummy/Placeholder Data Structure
// interface ResumeData {
//   name: string;
//   contact: string;
//   summary: string;
//   experience: {
//     role: string;
//     duration: string;
//     points: string[];
//   }[];
//   skills: string[];
// }

// // DEFAULT PLACEHOLDER DATA (Jo user ko pehli baar dikhega)
// const DEFAULT_RESUME: ResumeData = {
//   name: "Alex Chen",
//   contact: "483-555-6580  •  alex@chen.dev  •  linkedin.com/in/alexchen",
//   summary: "Results-driven Senior Software Engineer with 5+ years building scalable distributed systems. Passionate about clean architecture and shipping pristine production systems.",
//   experience: [
//     {
//       role: "Senior Software Engineer @ TechCorp",
//       duration: "2021 – 2022",
//       points: [
//         "Architected migration of monolithic backend to microservices, reducing p99 latency by 40%.",
//         "Developed real-time pipeline features utilizing multi-layered messaging fabrics."
//       ]
//     }
//   ],
//   skills: ["React", "Node.js", "Python", "TypeScript", "FastAPI", "PostgreSQL", "System Design"]
// };

// // ==========================================
// // THE EXACT DESIGN SPEC CSS
// // ==========================================
// const exactDesignStyles = `
//   @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');

//   * {
//     box-sizing: border-box;
//     margin: 0;
//     padding: 0;
//   }

//   body {
//     background-color: #030014;
//     color: #f3f4f6;
//     font-family: 'Plus Jakarta Sans', sans-serif;
//     overflow-x: hidden;
//   }

//   .custom-scroll::-webkit-scrollbar {
//     width: 6px;
//     height: 6px;
//   }
//   .custom-scroll::-webkit-scrollbar-track {
//     background: transparent;
//   }
//   .custom-scroll::-webkit-scrollbar-thumb {
//     background: rgba(255, 255, 255, 0.08);
//     border-radius: 99px;
//   }
//   .custom-scroll::-webkit-scrollbar-thumb:hover {
//     background: rgba(255, 255, 255, 0.15);
//   }

//   @keyframes cosmicGlow {
//     0%, 100% { opacity: 0.45; transform: scale(1) translateY(0px) rotate(0deg); }
//     50% { opacity: 0.65; transform: scale(1.08) translateY(-15px) rotate(3deg); }
//   }

//   @keyframes floatingStars {
//     0% { transform: translateY(0) scale(1); opacity: 0.1; }
//     50% { opacity: 0.7; }
//     100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
//   }

//   @keyframes inputBorderNeon {
//     0%, 100% { border-color: rgba(167, 139, 250, 0.25); box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.1); }
//     50% { border-color: rgba(6, 182, 212, 0.4); box-shadow: 0 0 15px rgba(6, 182, 212, 0.15); }
//   }

//   @keyframes laserSweep {
//     0% { background-position: 200% 0; }
//     100% { background-position: -200% 0; }
//   }

//   @keyframes pulseBadge {
//     0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
//     50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
//   }

//   @keyframes skeletonFlow {
//     0% { background-position: 100% 0; }
//     100% { background-position: -100% 0; }
//   }

//   @keyframes fadeInUp {
//     from { opacity: 0; transform: translateY(16px) scale(0.98); }
//     to { opacity: 1; transform: translateY(0) scale(1); }
//   }

//   .workspace-container {
//     display: grid;
//     grid-template-columns: 1.1fr 1.3fr;
//     gap: 28px;
//     padding: 0 40px 40px;
//     height: calc(100vh - 90px);
//     position: relative;
//     z-index: 5;
//   }

//   @media (max-width: 1024px) {
//     .workspace-container {
//       grid-template-columns: 1fr;
//       height: auto;
//       overflow-y: visible;
//     }
//   }
// `;

// export default function AIResumeArchitect() {
//   const [appState, setAppState] = useState<AppState>("idle");
//   const [profileData, setProfileData] = useState("");
//   const [jobDescription, setJobDescription] = useState("");
  
//   // Nayi State: Jo backend se aane wale data ko handle karegi
//   const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  
//   const [particles, setParticles] = useState<Particle[]>([]);
//   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // ASLI BACKEND CONNECTIVITY LOGIC
//   const handleGenerate = async () => {
//     if (!profileData || !jobDescription) {
//       alert("Bhai, raw profile aur JD dono fill karo pehle!");
//       return;
//     }
    
//     setAppState("loading");

//     try {
//       const response = await fetch("http://127.0.0.1:8000/api/generate-resume", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           profile: profileData,
//           jd: jobDescription,
//         }),
//       });

//       if (!response.ok) throw new Error("Backend server error!");

//       const result = await response.json();
      
//       // Real data state mein save ho gaya
//       setResumeData(result);
//       setAppState("done");
//     } catch (error) {
//       console.error("Error calling API:", error);
//       alert("Backend se connection fail ho gaya. Check karo uvicorn chal raha hai ya nahi.");
//       setAppState("idle");
//     }
//   };

//   useEffect(() => {
//     setParticles(
//       Array.from({ length: 28 }, (_, i) => ({
//         id: i,
//         left: `${Math.random() * 100}%`,
//         top: `${Math.random() * 100}%`,
//         size: `${Math.random() * 2 + 1}px`,
//         delay: `${Math.random() * 6}s`,
//         duration: `${Math.random() * 12 + 10}s`,
//       }))
//     );
//   }, []);

//   // Determine karein ki kaunsa data render karna hai (Asli ya Placeholder)
//   const currentResume = resumeData || DEFAULT_RESUME;

//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: exactDesignStyles }} />

//       {/* GRADIENT BACKGROUND */}
//       <div style={{ position: "fixed", inset: 0, backgroundColor: "#04020d", zIndex: 0, overflow: "hidden" }}>
//         <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "60vw", height: "60vh", background: "radial-gradient(circle, rgba(91, 33, 182, 0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
//         <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50vw", height: "50vh", background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
//         <div style={{
//           position: "absolute",
//           top: "35%",
//           left: "-10%",
//           width: "120%",
//           height: "320px",
//           background: "linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.25) 20%, rgba(6, 182, 212, 0.28) 50%, rgba(236, 72, 153, 0.18) 80%, transparent)",
//           filter: "blur(70px) contrast(1.2)",
//           transform: "skewY(-6deg)",
//           animation: "cosmicGlow 10s ease-in-out infinite",
//           pointerEvents: "none"
//         }} />
//         <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
//           {particles.map((p) => (
//             <div
//               key={p.id}
//               style={{
//                 position: "absolute",
//                 borderRadius: "50%",
//                 backgroundColor: "#fff",
//                 left: p.left,
//                 top: p.top,
//                 width: p.size,
//                 height: p.size,
//                 animation: `floatingStars ${p.duration} linear ${p.delay} infinite`,
//               }}
//             />
//           ))}
//         </div>
//       </div>

//       {/* VIEWPORT LAYER */}
//       <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
//         {/* NAV BAR */}
//         <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "relative" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//             <div style={{
//               width: "32px",
//               height: "32px",
//               borderRadius: "10px",
//               background: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)",
//               display: "flex",
//               alignItems: "center",
//               // justify: "center",
//               boxShadow: "0 0 16px rgba(167, 139, 250, 0.5)",
//               // alignItems: "center",
//               justifyContent: "center"
//             }}>
//               <span style={{ color: "#fff", fontSize: "16px", fontWeight: "bold" }}>✦</span>
//             </div>
//             <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px", background: "linear-gradient(to right, #ffffff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
//               AI Resume Architect
//             </span>
//           </div>

//           <div style={{
//             background: "rgba(255, 255, 255, 0.03)",
//             border: "1px solid rgba(255, 255, 255, 0.08)",
//             borderRadius: "999px",
//             padding: "8px 18px",
//             display: "flex",
//             alignItems: "center",
//             gap: "10px",
//             backdropFilter: "blur(10px)"
//           }}>
//             <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulseBadge 2s infinite" }} />
//             <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.85)", fontWeight: 600, letterSpacing: "0.3px" }}>CrewAI Powered</span>
//           </div>
//         </nav>

//         {/* WORKSPACE */}
//         <main className="workspace-container">
          
//           {/* LEFT PANEL */}
//           <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", paddingRight: "4px" }}>
//             <div style={{
//               background: "rgba(10, 7, 24, 0.45)",
//               border: "1px solid rgba(255, 255, 255, 0.06)",
//               borderRadius: "20px",
//               backdropFilter: "blur(24px)",
//               padding: "24px",
//               transition: "transform 0.3s ease, border-color 0.3s ease",
//             }}
//             onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)"}
//             onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"}>
//               <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
//                 <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                   <svg style={{ width: "16px", height: "16px", color: "#06b6d4" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
//                 </div>
//                 <h2 style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.2px", color: "#fff" }}>Raw Profile Data</h2>
//               </div>
//               <textarea
//                 value={profileData}
//                 onChange={(e) => setProfileData(e.target.value)}
//                 placeholder="Apne baare mein sab likh do (Skills, Projects, Education, Experience)..."
//                 className="custom-scroll"
//                 style={{
//                   width: "100%",
//                   height: "160px",
//                   background: "rgba(255, 255, 255, 0.02)",
//                   border: "1px solid rgba(255, 255, 255, 0.07)",
//                   borderRadius: "14px",
//                   color: "#f3f4f6",
//                   fontSize: "14px",
//                   padding: "16px",
//                   outline: "none",
//                   resize: "none",
//                   lineHeight: "1.6",
//                 }}
//                 onFocus={(e) => e.target.style.animation = "inputBorderNeon 3s infinite"}
//                 onBlur={(e) => { e.target.style.animation = "none"; e.target.style.borderColor = "rgba(255, 255, 255, 0.07)"; }}
//               />
//             </div>

//             <div style={{
//               background: "rgba(10, 7, 24, 0.45)",
//               border: "1px solid rgba(255, 255, 255, 0.06)",
//               borderRadius: "20px",
//               backdropFilter: "blur(24px)",
//               padding: "24px",
//               transition: "transform 0.3s ease, border-color 0.3s ease",
//             }}
//             onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)"}
//             onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"}>
//               <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
//                 <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                   <svg style={{ width: "16px", height: "16px", color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
//                 </div>
//                 <h2 style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.2px", color: "#fff" }}>Target Job Description</h2>
//               </div>
//               <textarea
//                 value={jobDescription}
//                 onChange={(e) => setJobDescription(e.target.value)}
//                 placeholder="Jis job ke liye apply karna hai, uska JD yahan paste karo..."
//                 className="custom-scroll"
//                 style={{
//                   width: "100%",
//                   height: "160px",
//                   background: "rgba(255, 255, 255, 0.02)",
//                   border: "1px solid rgba(255, 255, 255, 0.07)",
//                   borderRadius: "14px",
//                   color: "#f3f4f6",
//                   fontSize: "14px",
//                   padding: "16px",
//                   outline: "none",
//                   resize: "none",
//                   lineHeight: "1.6",
//                 }}
//                 onFocus={(e) => e.target.style.animation = "inputBorderNeon 3s infinite"}
//                 onBlur={(e) => { e.target.style.animation = "none"; e.target.style.borderColor = "rgba(255, 255, 255, 0.07)"; }}
//               />
//             </div>

//             <button
//               onClick={handleGenerate}
//               disabled={appState === "loading"}
//               style={{
//                 width: "100%",
//                 height: "56px",
//                 borderRadius: "999px",
//                 background: "#ffffff",
//                 color: "#030014",
//                 fontWeight: 800,
//                 fontSize: "15px",
//                 border: "none",
//                 cursor: appState === "loading" ? "not-allowed" : "pointer",
//                 position: "relative",
//                 overflow: "hidden",
//                 boxShadow: "0 20px 40px rgba(255, 255, 255, 0.07)",
//                 transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
//               }}
//               onMouseEnter={(e) => {
//                 if(appState !== "loading") {
//                   e.currentTarget.style.transform = "translateY(-2px)";
//                   e.currentTarget.style.boxShadow = "0 0 30px rgba(167, 139, 250, 0.4), 0 10px 30px rgba(6, 182, 212, 0.3)";
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if(appState !== "loading") {
//                   e.currentTarget.style.transform = "translateY(0)";
//                   e.currentTarget.style.boxShadow = "0 20px 40px rgba(255, 255, 255, 0.07)";
//                 }
//               }}
//             >
//               <span style={{
//                 position: "absolute",
//                 inset: 0,
//                 background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.15), transparent)",
//                 backgroundSize: "200% 100%",
//                 animation: "laserSweep 3s linear infinite",
//               }} />

//               <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
//                 {appState === "loading" ? (
//                   <>
//                     <svg style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
//                     Generating Elite Resume...
//                   </>
//                 ) : (
//                   "✦ Generate Elite Resume"
//                 )}
//               </span>
//             </button>
//           </div>

//           {/* RIGHT PANEL (PREVIEW) */}
//           <div style={{
//             background: "rgba(10, 7, 24, 0.45)",
//             border: "1px solid rgba(255, 255, 255, 0.06)",
//             borderRadius: "24px",
//             backdropFilter: "blur(24px)",
//             padding: "26px",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             position: "relative",
//             overflowY: "auto"
//           }}>
//             <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
//               <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(147, 51, 234, 0.1)", border: "1px solid rgba(147, 51, 234, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <svg style={{ width: "16px", height: "16px", color: "#a78bfa" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
//               </div>
//               <h2 style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.2px", color: "#fff" }}>Final Optimized Resume</h2>
//             </div>

//             <div style={{ flex: 1, height: "calc(100% - 50px)", position: "relative" }}>
              
//               {/* STATE: LOADING SKELETON */}
//               {appState === "loading" ? (
//                 <div style={{ display: "flex", flexDirection: "column", gap: "18px", height: "100%", padding: "8px", animation: "fadeInUp 0.3s ease both" }}>
//                   <SkeletonWireframe width="40%" height="24px" align="center" />
//                   <SkeletonWireframe width="65%" height="10px" align="center" />
                  
//                   <div style={{ marginTop: "14px" }}>
//                     <SkeletonWireframe width="20%" height="9px" />
//                     <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0 12px 0" }} />
//                     <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//                       <SkeletonWireframe width="100%" height="10px" />
//                       <SkeletonWireframe width="94%" height="10px" />
//                       <SkeletonWireframe width="78%" height="10px" />
//                     </div>
//                   </div>

//                   <div style={{ marginTop: "12px" }}>
//                     <SkeletonWireframe width="15%" height="9px" />
//                     <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0 12px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                       {[75, 90, 60, 85, 70].map((w, i) => (
//                         <SkeletonWireframe key={i} width={`${w}px`} height="24px" />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 /* CHAAHE IDLE HO YA DONE, AB EK RESUME ENVIRONMENT DIKHEGA */
//                 /* Agar idle hai toh placeholders dikhenge, done hai toh asli backend ka data */
//                 <div className="custom-scroll" style={{
//                   background: "#ffffff",
//                   borderRadius: "14px",
//                   padding: "40px 45px",
//                   color: "#1e293b",
//                   width: "100%",
//                   maxWidth: "794px",
//                   aspectRatio:"210 / 297",
//                   marginLeft: "auto",
//                   marginRight: "auto",
//                   // height: "100%",
//                   overflowY: "auto",
//                   boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
//                   opacity: appState === "idle" ? 0.6 : 1, // Idle state mein thoda faded premium look
//                   transition: "all 0.5s ease",
//                   animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
//                   flexShrink: 0
//                 }}>
//                   {appState === "idle" && (
//                     <div style={{ position: "absolute", top: "15px", right: "20px", background: "#6366f1", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>
//                       PREVIEW PLACEHOLDER
//                     </div>
//                   )}

//                   <div style={{ textAlign: "center" }}>
//                     <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
//                       {currentResume.name}
//                     </h1>
//                     <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 500 }}>
//                       {currentResume.contact}
//                     </p>
//                   </div>

//                   <div style={{ borderTop: "1px solid #e2e8f0", margin: "18px 0" }} />

//                   <h3 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "#6366f1", marginBottom: "8px" }}>Professional Summary</h3>
//                   <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.65" }}>
//                     {currentResume.summary}
//                   </p>

//                   <div style={{ borderTop: "1px solid #e2e8f0", margin: "18px 0" }} />

//                   <h3 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "#6366f1", marginBottom: "10px" }}>Experience</h3>
                  
//                   {currentResume.experience.map((exp, index) => (
//                     <div key={index} style={{ marginBottom: "16px" }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
//                         <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{exp.role}</span>
//                         <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>{exp.duration}</span>
//                       </div>
//                       <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#334155", lineHeight: "1.6" }}>
//                         {exp.points.map((pt, i) => (
//                           <li key={i} style={{ marginBottom: "4px" }}>{pt}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   ))}

//                   <div style={{ borderTop: "1px solid #e2e8f0", margin: "18px 0" }} />

//                   <h3 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "#6366f1", marginBottom: "10px" }}>Skills</h3>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
//                     {currentResume.skills.map((skill) => (
//                       <span key={skill} style={{ background: "#f1f5f9", color: "#475569", fontSize: "11.5px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px" }}>
//                         {skill}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//             </div>
//           </div>

//         </main>
//       </div>
//     </>
//   );
// }

// const SkeletonWireframe = ({ width, height, mt = "0px", align = "left" }: { width: string; height: string; mt?: string; align?: "left" | "center" }) => (
//   <div style={{
//     width,
//     height,
//     marginTop: mt,
//     marginLeft: align === "center" ? "auto" : "0",
//     marginRight: align === "center" ? "auto" : "0",
//     borderRadius: height === "24px" ? "8px" : "4px",
//     background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(167, 139, 250, 0.12) 50%, rgba(255,255,255,0.03) 75%)",
//     backgroundSize: "200% 100%",
//     animation: "skeletonFlow 1.6s ease-in-out infinite",
//     border: "1px solid rgba(255,255,255,0.02)"
//   }} />
// );


"use client";

import React, { useState, useEffect, useRef } from "react";

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
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BACKEND CONNECTIVITY — unchanged
  const handleGenerate = async () => {
    if (!profileData || !jobDescription) {
      alert("Bhai, raw profile aur JD dono fill karo pehle!");
      return;
    }
    setAppState("loading");
    try {
      const response = await fetch("https://unicorn-backend-2.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileData, jd: jobDescription }),
      });
      if (!response.ok) throw new Error("Backend server error!");
      const result = await response.json();
      setResumeData(result);
      setAppState("done");
    } catch (error) {
      console.error("Error calling API:", error);
      alert("Backend se connection fail ho gaya. Check karo uvicorn chal raha hai ya nahi.");
      setAppState("idle");
    }
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

        {/* NAV BAR */}
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
          </div>

          {/* RIGHT PANEL (PREVIEW) */}
          <div style={{ background: "rgba(10,7,24,0.45)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", backdropFilter: "blur(24px)", padding: "26px", display: "flex", flexDirection: "column", height: "100%", position: "relative", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg style={{ width: "16px", height: "16px", color: "#a78bfa" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Final Optimized Resume</h2>
            </div>

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
                /* RESUME PREVIEW — idle shows placeholder, done shows real data */
                <div className="custom-scroll" style={{
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

                  {/* PREVIEW BADGE — only in idle */}
                  {appState === "idle" && (
                    <div style={{ position: "absolute", top: "15px", right: "20px", background: "#6366f1", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>
                      PREVIEW PLACEHOLDER
                    </div>
                  )}

                  {/* ── NAME & CONTACT ── */}
                  <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                      {currentResume.name}
                    </h1>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 500 }}>
                      {currentResume.contact}
                    </p>
                  </div>

                  <Divider />

                  {/* ── SUMMARY ── */}
                  <SectionHeading title="Professional Summary" />
                  <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.65" }}>
                    {currentResume.summary}
                  </p>

                  <Divider />

                  {/* ── EXPERIENCE ── */}
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

                  {/* ── PROJECTS ── */}
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

                  {/* ── SKILLS ── */}
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

                  {/* ── EDUCATION ── */}
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

                  {/* ── ATS SCORE — only when real data is shown ── */}
                  {appState === "done" && currentResume.ats_score && (
                    <>
                      <Divider />
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "#16a34a" }}>
                          {currentResume.ats_score.split("—")[0].trim()}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#15803d", lineHeight: "1.4" }}>
                          {currentResume.ats_score.includes("—")
                            ? currentResume.ats_score.split("—").slice(1).join("—").trim()
                            : "ATS Match Score"}
                        </span>
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

// ── SMALL REUSABLE COMPONENTS ──
const Divider = () => (
  <div style={{ borderTop: "1px solid #e2e8f0", margin: "18px 0" }} />
);

const SectionHeading = ({ title }: { title: string }) => (
  <h3 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "#6366f1", marginBottom: "10px" }}>
    {title}
  </h3>
);

const SkeletonWireframe = ({ width, height, mt = "0px", align = "left" }: { width: string; height: string; mt?: string; align?: "left" | "center" }) => (
  <div style={{
    width, height, marginTop: mt,
    marginLeft: align === "center" ? "auto" : "0",
    marginRight: align === "center" ? "auto" : "0",
    borderRadius: height === "24px" ? "8px" : "4px",
    background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(167,139,250,0.12) 50%, rgba(255,255,255,0.03) 75%)",
    backgroundSize: "200% 100%",
    animation: "skeletonFlow 1.6s ease-in-out infinite",
    border: "1px solid rgba(255,255,255,0.02)"
  }} />
);