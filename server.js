import express from "express"
import fetch from "node-fetch"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.json({ limit: "2mb" }))

app.post("/api/claude", async (req, res) => {
  const { prompt, system } = req.body

  if (!prompt) return res.status(400).json({ error: "prompt is required" })

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Anthropic API error:", data)
      return res.status(response.status).json({ error: data })
    }

    res.json(data)
  } catch (err) {
    console.error("Server error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(PORT, () => {
  console.log(`Legible API server running at http://localhost:${PORT}`)
})
