import express from "express"
import fetch from "node-fetch"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname } from "path"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.json({ limit: "2mb" }))

app.post("/api/claude", async (req, res) => {
  const { prompt, system } = req.body

  if (!prompt) return res.status(400).json({ error: "prompt is required" })

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: system + "\n\n" + prompt }] }]
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Gemini API error:", data)
      return res.status(response.status).json({ error: data })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    res.json({ content: [{ text }] })
  } catch (err) {
    console.error("Server error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(PORT, () => {
  console.log(`Legible API server running at http://localhost:${PORT}`)
})