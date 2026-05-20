"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../../firebase"; // apna path
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface HistoryItem {
  id: string;
  jobTitle: string;
  createdAt: { seconds: number };
  profileInput: string;
  jdInput: string;
  resumeData: object;
  tokenCount: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/"); // login nahi hai toh wapas bhejo
        return;
      }

      const q = query(
        collection(db, "resumes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc") // latest pehle
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoryItem[];

      setHistory(items);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "resumes", id));
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#04020d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "sans-serif" }}>
      Loading history...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#04020d", padding: "40px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 800 }}>📋 Resume History</h1>
          <button onClick={() => router.push("/")}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 18px", borderRadius: "999px", cursor: "pointer", fontSize: "13px" }}>
            ← Back
          </button>
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: "80px", fontSize: "15px" }}>
            Abhi koi resume nahi bana. Pehla resume banao! ✦
          </div>
        )}

        {/* History list */}
        {history.map((item) => (
          <div key={item.id} style={{
            background: "rgba(10,7,24,0.6)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px", padding: "20px 24px", marginBottom: "16px",
            transition: "border-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: "0 0 6px" }}>
                  {item.jobTitle || "Resume"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 12px" }}>
                  🕐 {item.createdAt ? formatDate(item.createdAt.seconds) : "—"}
                  &nbsp;&nbsp;⚡ {item.tokenCount?.toLocaleString() ?? "—"} tokens
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                <button
                  onClick={() => {
                    // Main page pe is resume ka data load karo
                    localStorage.setItem("loadResume", JSON.stringify(item));
                    router.push("/");
                  }}
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a78bfa", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                  Load
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                  Delete
                </button>
              </div>
            </div>

            {/* Preview of job description */}
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.jdInput?.slice(0, 100)}...
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}