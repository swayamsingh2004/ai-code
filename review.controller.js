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
    Review this ${language || 'code'} and respond ONLY with a valid JSON object.
    IMPORTANT RULES:
    - Respond with ONLY the JSON object, no extra text, no markdown, no backticks
    - All string values must escape special characters properly
    - Do NOT use double quotes inside string values — use single quotes instead
    - The improvedCode field must be a single line string with \\n for newlines
    Use EXACTLY this format:
    {"score":<number 1-10>,"summary":"<one line summary>","issues":[{"severity":"critical|warning|suggestion","line":<number or null>,"message":"<what is wrong>","fix":"<how to fix it>"}],"positives":["<what is good>"],"improvedCode":"<corrected code with \\n for newlines>"}
    Code to review:
    ${code}
  `
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a code reviewer. Always respond with valid JSON only. Never use markdown. Never use backticks. Escape all special characters in strings.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
  })
  const text = result.choices[0].message.content
  let clean = text.replace(/```json|```/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    clean = jsonMatch[0]
  }
  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    try {
      const fixedClean = clean
        .replace(/:\s*"([\s\S]*?)"/g, (match, p1) => {
          const fixed = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
          return `: "${fixed}"`
        })
      parsed = JSON.parse(fixedClean)
    } catch (e2) {
      return res.json(new ApiResponse(200, {
        score: 0,
        summary: "Could not parse AI response for this code. Try simplifying the code or try again.",
        issues: [{
          severity: "warning",
          line: null,
          message: "AI returned malformed response for this input",
          fix: "Try submitting a smaller code snippet or try again"
        }],
        positives: [],
        improvedCode: code
      }, "AI review completed with fallback"))
    }
  }
  return res.json(new ApiResponse(200, parsed, "AI review completed"))
})
export default generate