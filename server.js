import express from "express"
import teraboxRoute from "./terabox.js"

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Routes
app.use("/api", teraboxRoute)

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀")
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})