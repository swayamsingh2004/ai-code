
import dotenv from 'dotenv'
dotenv.config();
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import reviewrouter from "./review.routes.js"


const app = express()


app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json({ limit: '16kb' }))


const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, slow down!' }
})
app.use('/api/review', limiter)
app.use('/api/review',reviewrouter)
console.log('GROQ KEY:', process.env.GROQ_API_KEY)
app.get('/test', (req, res) => {
  res.json({ message: 'server works' })
})
const server = app.listen(8000, () => {
  console.log('App is running on port 8000')
})

server.on('error', (err) => {
  console.log('Server error:', err)
})

