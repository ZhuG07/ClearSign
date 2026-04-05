import { useState } from "react"
import "./App.css"

const ROLES = [
  { id: "tenant", label: "Tenant", context: "reviewing a rental lease or tenancy agreement" },
  { id: "employee", label: "Employee", context: "reading an employment contract or workplace policy" },
  { id: "consumer", label: "Consumer", context: "accepting terms of service or a user agreement" },
  { id: "student", label: "Student", context: "reading a university or academic policy" },
]

const CATEGORIES = {
  risk:       { bg: "#FCEBEB", text: "#A32D2D", label: "Risk — watch out" },
  obligation: { bg: "#FAEEDA", text: "#854F0B", label: "Obligation — what you must do" },
  right:      { bg: "#EAF3DE", text: "#3B6D11", label: "Right — what you're entitled to" },
  deadline:   { bg: "#E6F1FB", text: "#185FA5", label: "Deadline — time-sensitive" },
}

const RISK_CONFIG = {
  low:    { label: "Low risk", color: "#3B6D11", bg: "#EAF3DE" },
  medium: { label: "Medium risk", color: "#854F0B", bg: "#FAEEDA" },
  high:   { label: "High risk", color: "#A32D2D", bg: "#FCEBEB" },
}

function applyHighlights(text, highlights) {
  let segments = [{ text, highlighted: false }]
  const sorted = [...highlights].sort((a, b) => b.phrase.length - a.phrase.length)

  for (const { phrase, category } of sorted) {
    const next = []
    for (const seg of segments) {
      if (seg.highlighted) { next.push(seg); continue }
      const idx = seg.text.indexOf(phrase)
      if (idx === -1) { next.push(seg); continue }
      if (idx > 0) next.push({ text: seg.text.slice(0, idx), highlighted: false })
      next.push({ text: phrase, highlighted: true, category })
      const rest = seg.text.slice(idx + phrase.length)
      if (rest) next.push({ text: rest, highlighted: false })
    }
    segments = next
  }
  return segments
}

async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system }),
  })
  if (!res.ok) throw new Error("API call failed")
  const data = await res.json()
  const raw = data.content?.[0]?.text ?? ""
  return raw.replace(/```json|```/g, "").trim()
}

async function analyzeDocument(text, roleId) {
  const role = ROLES.find(r => r.id === roleId)
  const system = `You are a legal document assistant. Help everyday people with no legal background understand documents. The user is a ${role.label} ${role.context}. Be concise, warm, and jargon-free. Return only valid JSON with no markdown fences.`

  const [summaryRaw, highlightsRaw] = await Promise.all([
    callClaude(
      `Analyze this document from the perspective of a ${role.label} ${role.context}.
Return this exact JSON structure:
{
  "summary": "2-3 sentence plain English overview of what this document is and does",
  "key_points": ["4-6 most important things the ${role.label} needs to know"],
  "bottom_line": "One short paragraph like a knowledgeable friend explaining what to watch out for before signing",
  "risk_level": "low or medium or high"
}

Document:
${text.slice(0, 6000)}`,
      system
    ),
    callClaude(
      `Extract the 10-16 most important phrases from this document for a ${role.label} ${role.context}.
Return a JSON array of objects. Each phrase must appear verbatim in the document.
[{ "phrase": "exact phrase", "category": "risk" | "obligation" | "right" | "deadline" }]

risk = clauses that could harm the user
obligation = things the user must do
right = things the user is entitled to
deadline = time-sensitive clauses

Document:
${text.slice(0, 6000)}`,
      system
    ),
  ])

  const summary = JSON.parse(summaryRaw)
  const highlights = JSON.parse(highlightsRaw)
  return { summary, highlights }
}

export default function App() {
  const [screen, setScreen] = useState("input") // input | loading | results
  const [docText, setDocText] = useState("")
  const [role, setRole] = useState("tenant")
  const [result, setResult] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [error, setError] = useState("")

  async function handleAnalyze() {
    if (!docText.trim()) return
    setError("")
    setScreen("loading")

    const messages = [
      "Reading your document...",
      "Identifying key clauses...",
      "Writing plain English summary...",
      "Applying highlights...",
    ]
    let i = 0
    setLoadingMsg(messages[0])
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingMsg(messages[i])
    }, 2200)

    try {
      const data = await analyzeDocument(docText, role)
      clearInterval(interval)
      setResult(data)
      setScreen("results")
    } catch (e) {
      clearInterval(interval)
      setError("Something went wrong. Check your API connection and try again.")
      setScreen("input")
    }
  }

  if (screen === "input") return <InputScreen docText={docText} setDocText={setDocText} role={role} setRole={setRole} onAnalyze={handleAnalyze} error={error} />
  if (screen === "loading") return <LoadingScreen message={loadingMsg} />
  if (screen === "results") return <ResultsScreen result={result} docText={docText} onBack={() => setScreen("input")} />
}

function InputScreen({ docText, setDocText, role, setRole, onAnalyze, error }) {
  return (
    <div className="input-screen">
      <div className="hero">
        <h1 className="logo">ClearSign</h1>
        <p className="tagline">Making legal documents human.</p>
      </div>

      <div className="role-section">
        <p className="role-label">I am reviewing this document as a...</p>
        <div className="roles">
          {ROLES.map(r => (
            <button key={r.id} className={`role-btn ${role === r.id ? "active" : ""}`} onClick={() => setRole(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="doc-input"
        value={docText}
        onChange={e => setDocText(e.target.value)}
        placeholder="Paste your legal document, contract, or terms of service here..."
      />

      {error && <p className="error">{error}</p>}

      <button className="analyze-btn" onClick={onAnalyze} disabled={!docText.trim()}>
        Analyse document
      </button>

      <p className="privacy-note">Your document is never stored. Everything is processed in-session only.</p>
    </div>
  )
}

function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="loading-msg">{message}</p>
    </div>
  )
}

function ResultsScreen({ result, docText, onBack }) {
  const { summary, highlights } = result
  const segments = applyHighlights(docText, highlights)
  const risk = RISK_CONFIG[summary.risk_level] ?? RISK_CONFIG.medium

  return (
    <div className="results-screen">
      <div className="results-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="results-title">ClearSign</span>
        <span className="risk-badge" style={{ background: risk.bg, color: risk.color }}>
          {risk.label}
        </span>
      </div>

      <div className="results-grid">
        <div className="doc-panel">
          <p className="panel-label">Original document</p>
          <div className="doc-text">
            {segments.map((seg, i) =>
              seg.highlighted ? (
                <mark key={i} className={`hl hl-${seg.category}`} title={seg.category}>
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </div>
          <div className="legend">
            {Object.entries(CATEGORIES).map(([key, val]) => (
              <div key={key} className="legend-item">
                <span className="legend-swatch" style={{ background: val.bg, border: `1px solid ${val.text}` }} />
                <span>{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-panel">
          <div className="card">
            <p className="card-label">What is this?</p>
            <p className="card-text">{summary.summary}</p>
          </div>

          <div className="card">
            <p className="card-label">Key points</p>
            <ul className="key-points">
              {summary.key_points?.map((pt, i) => <li key={i}>{pt}</li>)}
            </ul>
          </div>

          <div className="card card-highlight">
            <p className="card-label">Bottom line</p>
            <p className="card-text">{summary.bottom_line}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
