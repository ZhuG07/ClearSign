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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Groq API error:", data)
      return res.status(response.status).json({ error: data })
    }

    const text = data.choices?.[0]?.message?.content ?? ""
    res.json({ content: [{ text }] })
  } catch (err) {
    console.error("Server error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(PORT, () => {
  console.log(`Legible API server running at http://localhost:${PORT}`)
})