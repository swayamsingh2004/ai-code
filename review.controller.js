import Groq from 'groq-sdk'
import { ApiError } from "./ApiError.js"
import { ApiResponse } from "./ApiResponse.js"
import { asyncHandler } from "./asyncHandler.js"


const generate = asyncHandler(async (req, res) => {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const { code, language } = req.body

  if (!code) {
    throw new ApiError(400, "Please enter the code")
  }

  const prompt = `
    You are a senior software engineer doing a code review.
    Review this ${language || 'code'} and respond ONLY in this JSON format:
    {
      "score": <number 1-10>,
      "summary": "<one line summary>",
      "issues": [
        { "severity": "critical|warning|suggestion", "line": <number or null>, "message": "<what is wrong>", "fix": "<how to fix it>" }
      ],
      "positives": ["<what is good about this code>"],
      "improvedCode": "<the full corrected code>"
    }
    Code to review:
    \`\`\`${language || ''}
    ${code}
    \`\`\`
  `

  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = result.choices[0].message.content
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return res.json(new ApiResponse(200, parsed, "AI review completed"))
})

export default generate