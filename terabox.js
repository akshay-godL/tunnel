import express from "express"
import axios from "axios"

var router = express.Router()

/* ================================
   TERABOX FUNCTION
================================ */
var terabox = async (url) => {
  if (!url) throw new Error("Terabox URL is required")

  // Step 1: Solve Cloudflare Turnstile
  var { data: cf } = await axios.post(
    "https://api.nekolabs.web.id/tools/bypass/cf-turnstile",
    {
      url: "https://teraboxdl.site/",
      siteKey: "0x4AAAAAACG0B7jzIiua8JFj"
    },
    {
      headers: {
        "content-type": "application/json"
      }
    }
  )

  if (!cf?.result) throw new Error("Failed to solve Turnstile")

  // Step 2: Request teraboxdl proxy
  var { data } = await axios.post(
    "https://teraboxdl.site/api/proxy",
    {
      url: url,
      cf_token: cf.result
    },
    {
      headers: {
        authority: "teraboxdl.site",
        accept: "*/*",
        "content-type": "application/json",
        origin: "https://teraboxdl.site",
        referer: "https://teraboxdl.site/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 20000
    }
  )

  if (!data?.list || !data.list.length) {
    throw new Error("No files found")
  }

  var file = data.list[0]

  return {
    file_name: file.server_filename || file.path?.replace("/", ""),
    size: file.size,
    d_link: file.dlink
  }
}

/* ================================
   POST → /api/terabox
   body: { url, password }
================================ */
router.post("/terabox", async (req, res) => {
  try {
    const { url, password } = req.body

    if (!password) {
      return res.status(401).json({
        status: false,
        message: "Password is required"
      })
    }

    if (password !== "eypz-pvt") {
      return res.status(403).json({
        status: false,
        message: "Invalid password"
      })
    }

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Provide Terabox url in request body"
      })
    }

    var result = await terabox(url)

    res.json({
      status: true,
      creator: "Akshay-Eypz",
      result: result
    })

  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    })
  }
})

export default router