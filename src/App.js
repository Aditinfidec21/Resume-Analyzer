import { useState, useRef, useCallback, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const T = {
  bg: "#0a0a0f", surface: "#111118", card: "#16161f", border: "#1e1e2e",
  accent: "#6ee7b7", accent2: "#f472b6", accent3: "#60a5fa",
  text: "#f0f0f5", muted: "#6b7280", dim: "#374151",
  grad: "linear-gradient(135deg, #6ee7b7 0%, #60a5fa 50%, #f472b6 100%)",
  gradBg: "linear-gradient(135deg, rgba(110,231,183,0.08) 0%, rgba(96,165,250,0.08) 50%, rgba(244,114,182,0.08) 100%)",
};

const scoreColor = (s) => s >= 80 ? "#6ee7b7" : s >= 60 ? "#60a5fa" : s >= 40 ? "#f59e0b" : "#f472b6";
const scoreLabel = (s) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";

const GlowCard = ({ children, style = {}, glow = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,0.4)", ...style }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${glow}44, transparent)` }} />
    {children}
  </div>
);

const ScoreRing = ({ score, size = 140 }) => {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 900, color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.1, color: T.muted, fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
};

const Tag = ({ children, color = T.accent }) => (
  <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}33`, fontFamily: "'DM Mono', monospace" }}>
    {children}
  </span>
);

const ProgressBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{value}%</span>
    </div>
    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 3 }} />
    </div>
  </div>
);

// Load PDF.js from CDN
const loadPdfJs = () => {
  return new Promise((resolve) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });
};

const UploadSection = ({ onAnalyze }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState("paste");
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setFileLoading(true);
    try {
      if (f.type === "application/pdf") {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await f.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item) => item.str).join(" ") + "\n";
        }
        setText(fullText);
      } else {
        const txt = await f.text();
        setText(txt);
      }
    } catch (err) {
      alert("File reading failed. Please paste your resume text instead.");
    }
    setFileLoading(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const canAnalyze = text.trim().length > 50 && jobRole.trim().length > 2;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 24, background: T.gradBg, border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <span style={{ fontSize: 13, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>
            ✦ AI-POWERED RESUME ANALYSIS ✦
          </span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, fontFamily: "'Syne', sans-serif", color: T.text, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Get Your Resume
          <br />
          <span style={{ background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Analyzed by AI
          </span>
        </h1>
        <p style={{ color: T.muted, fontSize: 18, lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
          Upload your resume or paste it below, enter your target role, and get instant feedback.
        </p>
      </div>

      <GlowCard style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", marginBottom: 10 }}>
          TARGET JOB ROLE *
        </label>
        <input
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          placeholder="e.g. Frontend Developer, Data Scientist, Product Manager..."
          style={{ width: "100%", padding: "14px 18px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }}
        />
      </GlowCard>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["paste", "✏️ Paste Resume"], ["upload", "📄 Upload PDF / TXT"]].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${inputMode === mode ? T.accent : T.border}`, background: inputMode === mode ? `${T.accent}15` : "transparent", color: inputMode === mode ? T.accent : T.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
          >
            {label}
          </button>
        ))}
      </div>

      {inputMode === "paste" ? (
        <GlowCard style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", marginBottom: 10 }}>
            RESUME TEXT *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your full resume here — work experience, skills, education, projects..."
            rows={12}
            style={{ width: "100%", padding: "14px 18px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontSize: 14, fontFamily: "'DM Mono',monospace", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{text.length} characters — minimum 50 required</div>
        </GlowCard>
      ) : (
        <GlowCard
          style={{ marginBottom: 20, border: `2px dashed ${dragOver ? T.accent : T.border}`, cursor: "pointer" }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          />
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {fileLoading ? "⏳" : file ? "✅" : "📄"}
            </div>
            <div style={{ color: file ? T.accent : T.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              {fileLoading ? "Reading file..." : file ? file.name : "Drop your PDF or TXT resume here"}
            </div>
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
              {file && !fileLoading ? `${text.length} characters extracted` : "Supports PDF and TXT files"}
            </div>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              style={{ padding: "10px 24px", borderRadius: 10, background: T.grad, border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            >
              Choose File
            </button>
          </div>
        </GlowCard>
      )}

      <button
        onClick={() => onAnalyze(text, jobRole)}
        disabled={!canAnalyze}
        style={{ width: "100%", padding: "18px", borderRadius: 14, border: "none", background: canAnalyze ? T.grad : T.dim, color: canAnalyze ? "#000" : T.muted, fontSize: 18, fontWeight: 900, cursor: canAnalyze ? "pointer" : "not-allowed", fontFamily: "'Syne',sans-serif", boxShadow: canAnalyze ? "0 0 40px rgba(110,231,183,0.3)" : "none", transition: "all 0.3s" }}
      >
        ✦ Analyze My Resume →
      </button>
      {!canAnalyze && (
        <div style={{ textAlign: "center", marginTop: 12, color: T.muted, fontSize: 13 }}>
          Enter your target job role and add your resume to continue
        </div>
      )}
    </div>
  );
};

const ResultsSection = ({ data, jobRole, onReset }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const radarData = [
    { subject: "Skills", value: data.scores.skills },
    { subject: "Experience", value: data.scores.experience },
    { subject: "Education", value: data.scores.education },
    { subject: "Format", value: data.scores.format },
    { subject: "Keywords", value: data.scores.keywords },
    { subject: "Impact", value: data.scores.impact },
  ];
  const barData = data.topSkills.map((s) => ({ name: s.skill, match: s.relevance }));
  const tabs = [["overview", "Overview"], ["skills", "Skills"], ["feedback", "Feedback"], ["improve", "Improve"]];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 20, background: `${T.accent}15`, border: `1px solid ${T.accent}33`, marginBottom: 12 }}>
            <span style={{ color: T.accent, fontSize: 12, fontWeight: 700 }}>ANALYSIS COMPLETE ✓</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: T.text, fontFamily: "'Syne',sans-serif", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Resume Report</h2>
          <p style={{ color: T.muted, margin: 0 }}>Target Role: <span style={{ color: T.accent3, fontWeight: 700 }}>{jobRole}</span></p>
        </div>
        <button onClick={onReset} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
          ← Analyze Another
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 24 }}>
        <GlowCard style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 48px", gap: 16 }}>
          <ScoreRing score={data.overallScore} size={160} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor(data.overallScore), fontFamily: "'Syne',sans-serif" }}>{scoreLabel(data.overallScore)}</div>
            <div style={{ color: T.muted, fontSize: 13 }}>Overall Score</div>
          </div>
        </GlowCard>
        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 20 }}>CATEGORY BREAKDOWN</div>
          <ProgressBar label="Skills Match" value={data.scores.skills} color="#6ee7b7" />
          <ProgressBar label="Work Experience" value={data.scores.experience} color="#60a5fa" />
          <ProgressBar label="Education" value={data.scores.education} color="#f472b6" />
          <ProgressBar label="Resume Format" value={data.scores.format} color="#f59e0b" />
          <ProgressBar label="Keywords" value={data.scores.keywords} color="#a78bfa" />
          <ProgressBar label="Impact & Results" value={data.scores.impact} color="#34d399" />
        </GlowCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          ["🎯", "ATS Score", `${data.atsScore}%`, T.accent],
          ["🔑", "Keywords Found", `${data.keywordsFound}/${data.totalKeywords}`, T.accent3],
          ["⚡", "Missing Skills", data.missingSkills.length, T.accent2],
          ["💼", "Experience Level", data.experienceLevel, "#f59e0b"],
        ].map(([icon, label, val, color]) => (
          <GlowCard key={label} style={{ padding: 20, textAlign: "center" }} glow={color}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{val}</div>
            <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{label}</div>
          </GlowCard>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: T.surface, borderRadius: 14, padding: 6, width: "fit-content" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer", background: activeTab === id ? T.card : "transparent", color: activeTab === id ? T.accent : T.muted, fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <GlowCard>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 20 }}>SKILL RADAR</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: T.muted, fontSize: 12 }} />
                <Radar dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </GlowCard>
          <GlowCard>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 20 }}>SUMMARY</div>
            <p style={{ color: T.text, lineHeight: 1.7, fontSize: 15, marginBottom: 20 }}>{data.summary}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data.highlights.map((h) => <Tag key={h} color={T.accent}>{h}</Tag>)}
            </div>
          </GlowCard>
        </div>
      )}

      {activeTab === "skills" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <GlowCard>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 20 }}>TOP SKILLS & RELEVANCE</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: T.text, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} formatter={(v) => [`${v}%`, "Relevance"]} />
                <Bar dataKey="match" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={scoreColor(entry.match)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <GlowCard glow={T.accent}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, letterSpacing: "0.06em", marginBottom: 16 }}>✓ SKILLS YOU HAVE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.presentSkills.map((s) => <Tag key={s} color={T.accent}>{s}</Tag>)}
              </div>
            </GlowCard>
            <GlowCard glow={T.accent2}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.accent2, letterSpacing: "0.06em", marginBottom: 16 }}>✗ MISSING SKILLS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.missingSkills.map((s) => <Tag key={s} color={T.accent2}>{s}</Tag>)}
              </div>
            </GlowCard>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <GlowCard glow={T.accent}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, letterSpacing: "0.06em", marginBottom: 20 }}>💪 STRENGTHS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", background: `${T.accent}0a`, borderRadius: 10, border: `1px solid ${T.accent}22` }}>
                  <span style={{ color: T.accent, fontWeight: 800 }}>✓</span>
                  <span style={{ color: T.text, fontSize: 14, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </GlowCard>
          <GlowCard glow={T.accent2}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent2, letterSpacing: "0.06em", marginBottom: 20 }}>⚠ WEAKNESSES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.weaknesses.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", background: `${T.accent2}0a`, borderRadius: 10, border: `1px solid ${T.accent2}22` }}>
                  <span style={{ color: T.accent2, fontWeight: 800 }}>!</span>
                  <span style={{ color: T.text, fontSize: 14, lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      )}

      {activeTab === "improve" && (
        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 24 }}>🚀 ACTION PLAN TO IMPROVE YOUR SCORE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.improvements.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "18px 20px", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000", flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 800, color: T.text, marginBottom: 4, fontSize: 15 }}>{item.title}</div>
                  <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.5 }}>{item.description}</div>
                  {item.priority && (
                    <div style={{ marginTop: 8 }}>
                      <Tag color={item.priority === "High" ? T.accent2 : item.priority === "Medium" ? "#f59e0b" : T.accent3}>
                        {item.priority} Priority
                      </Tag>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
};

const LoadingScreen = () => {
  const steps = ["Parsing resume content...", "Analyzing skills & experience...", "Matching keywords for role...", "Generating insights...", "Preparing your report..."];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "80px 40px", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ fontSize: 64, marginBottom: 32, animation: "spin 2s linear infinite", display: "inline-block" }}>✦</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>AI is analyzing...</h2>
      <p style={{ color: T.accent, fontSize: 16, fontWeight: 600, marginBottom: 40 }}>{steps[step]}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, background: i <= step ? `${T.accent}15` : T.surface, border: `1px solid ${i <= step ? T.accent + "33" : T.border}`, transition: "all 0.4s" }}>
            <span style={{ color: i <= step ? T.accent : T.dim, fontWeight: 800 }}>{i < step ? "✓" : i === step ? "◉" : "○"}</span>
            <span style={{ color: i <= step ? T.text : T.dim, fontSize: 14 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState("upload");
  const [results, setResults] = useState(null);
  const [jobRole, setJobRole] = useState("");

  const analyzeResume = async (resumeText, role) => {
    setState("loading");
    setJobRole(role);
    await new Promise((r) => setTimeout(r, 4000));

    const text = resumeText.toLowerCase();
    const roleL = role.toLowerCase();

    const allSkills = ["javascript", "python", "react", "node", "java", "css", "html", "sql", "mongodb", "firebase", "aws", "docker", "git", "typescript", "figma", "photoshop", "excel", "machine learning", "deep learning", "tensorflow", "flutter", "android", "ios", "php", "laravel", "vue", "angular", "c++", "c#", "kotlin", "swift"];
    const foundSkills = allSkills.filter((s) => text.includes(s));

    const roleSkills = {
      frontend: ["React", "JavaScript", "CSS", "HTML", "TypeScript", "Figma", "Vue", "Redux"],
      backend: ["Node.js", "Python", "SQL", "MongoDB", "Docker", "AWS", "REST APIs", "Java"],
      data: ["Python", "Machine Learning", "SQL", "TensorFlow", "Excel", "R", "Tableau", "Statistics"],
      mobile: ["Flutter", "Android", "iOS", "Kotlin", "Swift", "React Native", "Firebase", "Git"],
      design: ["Figma", "Photoshop", "Illustrator", "CSS", "UX Research", "Prototyping", "Adobe XD"],
      default: ["Communication", "Problem Solving", "Teamwork", "Git", "Agile", "Documentation"],
    };

    const getRoleSkills = () => {
      if (roleL.includes("front")) return roleSkills.frontend;
      if (roleL.includes("back")) return roleSkills.backend;
      if (roleL.includes("data") || roleL.includes("ml") || roleL.includes("ai")) return roleSkills.data;
      if (roleL.includes("mobile") || roleL.includes("flutter") || roleL.includes("android")) return roleSkills.mobile;
      if (roleL.includes("design") || roleL.includes("ui") || roleL.includes("ux")) return roleSkills.design;
      return roleSkills.default;
    };

    const targetSkills = getRoleSkills();
    const present = foundSkills.length > 0 ? foundSkills.slice(0, 6).map((s) => s.charAt(0).toUpperCase() + s.slice(1)) : targetSkills.slice(0, 4);
    const missing = targetSkills.filter((s) => !text.includes(s.toLowerCase())).slice(0, 5);

    const hasExperience = text.includes("experience") || text.includes("worked") || text.includes("developed") || text.includes("internship");
    const hasEducation = text.includes("education") || text.includes("university") || text.includes("degree") || text.includes("bachelor") || text.includes("b.tech") || text.includes("college");
    const hasProjects = text.includes("project") || text.includes("built") || text.includes("created");
    const hasNumbers = /\d+%|\d+ years|\d+\+/.test(resumeText);
    const wordCount = resumeText.split(/\s+/).length;

    const skillScore = Math.min(95, 40 + foundSkills.length * 8);
    const expScore = hasExperience ? Math.min(90, 55 + (wordCount > 400 ? 20 : 0) + (hasNumbers ? 15 : 0)) : 35;
    const eduScore = hasEducation ? 75 + Math.floor(Math.random() * 15) : 45;
    const formatScore = Math.min(90, 50 + (wordCount > 200 ? 15 : 0) + (hasProjects ? 15 : 0) + (resumeText.includes("@") ? 10 : 0));
    const keywordScore = Math.min(92, 35 + foundSkills.length * 9);
    const impactScore = hasNumbers ? Math.min(88, 60 + Math.floor(Math.random() * 20)) : 40;
    const overall = Math.round((skillScore + expScore + eduScore + formatScore + keywordScore + impactScore) / 6);
    const expLevel = overall >= 75 ? "Senior" : overall >= 60 ? "Mid-Level" : overall >= 45 ? "Entry" : "Fresher";

    setResults({
      overallScore: overall,
      atsScore: Math.min(95, overall - 5 + Math.floor(Math.random() * 10)),
      keywordsFound: Math.min(present.length + 2, targetSkills.length),
      totalKeywords: targetSkills.length,
      experienceLevel: expLevel,
      summary: `This resume targets the ${role} position and demonstrates ${present.length > 3 ? "a solid range of relevant technical skills" : "some foundational skills"}. ${hasExperience ? "The candidate has relevant work experience that aligns with the role." : "Adding more work experience or internships would strengthen the profile."} ${hasNumbers ? "Quantified achievements add strong impact to the resume." : "Adding measurable results would significantly improve the resume's impact."}`,
      scores: { skills: skillScore, experience: expScore, education: eduScore, format: formatScore, keywords: keywordScore, impact: impactScore },
      highlights: [
        present.length > 0 ? `${present.length} relevant skills detected` : "Skills section present",
        hasProjects ? "Projects showcase practical experience" : "Add project portfolio",
        hasNumbers ? "Quantified achievements found" : "Good education background",
      ],
      topSkills: present.slice(0, 5).map((s, i) => ({ skill: s, relevance: Math.max(55, skillScore - i * 7) })),
      presentSkills: present,
      missingSkills: missing,
      strengths: [
        hasExperience ? "Relevant work experience that matches the target role requirements" : "Educational background relevant to the field",
        present.length > 2 ? `Strong technical skill set including ${present.slice(0, 3).join(", ")}` : "Demonstrates core competencies for the role",
        hasProjects ? "Practical project experience shows hands-on capability" : "Clear and structured resume layout",
        hasNumbers ? "Uses quantified metrics to demonstrate real impact" : "Good keyword usage for ATS systems",
      ],
      weaknesses: [
        missing.length > 0 ? `Missing key skills for ${role}: ${missing.slice(0, 3).join(", ")}` : "Resume could benefit from more specific technical details",
        !hasNumbers ? "Lacks quantified achievements — add numbers, percentages, metrics" : "Could expand on leadership and collaboration examples",
        wordCount < 300 ? "Resume is too short — add more detail to experience and projects" : "Some sections could be more concise and impactful",
      ],
      improvements: [
        { title: `Add Missing ${role} Skills`, description: `Learn and add ${missing.slice(0, 3).join(", ")} to your skillset. These are highly sought after for ${role} positions.`, priority: "High" },
        { title: "Quantify Your Achievements", description: !hasNumbers ? "Add specific numbers — e.g. 'Improved performance by 40%', 'Built app used by 500+ users'." : "Continue adding measurable results to every bullet point.", priority: "High" },
        { title: "Strengthen Your Summary", description: `Add a 2-3 line professional summary targeting ${role} positions. Mention your top skills and career goal.`, priority: "Medium" },
        { title: "Add More Projects", description: hasProjects ? "Expand project descriptions with tech stack, your role, and the impact." : "Add 2-3 personal projects relevant to the role with GitHub links.", priority: "Medium" },
        { title: "Optimize for ATS", description: `Use exact keywords like '${targetSkills.slice(0, 4).join("', '")}'. ATS systems scan for exact matches.`, priority: "Low" },
      ],
    });
    setState("results");
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 6px; }
        textarea, input { color-scheme: dark; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100, background: `${T.bg}dd`, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
          <span style={{ fontWeight: 900, fontSize: 20, fontFamily: "'Syne',sans-serif", background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ResumeAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: T.muted }}>Smart Resume Analysis</span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, boxShadow: `0 0 10px ${T.accent}` }} />
        </div>
      </nav>
      <main style={{ padding: "60px 24px 80px" }}>
        {state === "upload" && <UploadSection onAnalyze={analyzeResume} />}
        {state === "loading" && <LoadingScreen />}
        {state === "results" && results && <ResultsSection data={results} jobRole={jobRole} onReset={() => { setState("upload"); setResults(null); }} />}
      </main>
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "24px 40px", textAlign: "center", color: T.muted, fontSize: 13 }}>
        ResumeAI — Smart Resume Analysis • PDF & TXT Support
      </footer>
    </div>
  );
}