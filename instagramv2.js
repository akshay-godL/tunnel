import express from "express"
import axios from "axios"
import * as cheerio from "cheerio"

var router = express.Router()

/* ================================
   INSTAGRAM FUNCTION
================================ */
var instagram = async (url) => {
  if (!url || !url.includes("instagram.com")) {
    throw new Error("A valid Instagram URL is required")
  }

  // Step 1: Get CSRF Token and Cookies from the provider
  const getPage = await axios.get('https://indown.io/en1', {
    headers: { 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
    }
  });
  
  const cookies = getPage.headers['set-cookie']?.map(v => v.split(';')[0]).join('; ');
  const $initial = cheerio.load(getPage.data);
  const token = $initial('input[name="_token"]').val();

  if (!token) throw new Error("Could not fetch security token");

  // Step 2: Request the download links
  const { data } = await axios.post('https://indown.io/download', 
    new URLSearchParams({
      referer: 'https://indown.io/en1',
      locale: 'en',
      _token: token,
      link: url,
      p: 'i'
    }).toString(),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://indown.io',
        'referer': 'https://indown.io/en1',
        'cookie': cookies || '',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }
  );

  // Step 3: Parse the results
  const $ = cheerio.load(data);
  let resultUrl = null;

  $('video source[src], a[href]').each((_, e) => {
    let v = $(e).attr('src') || $(e).attr('href');
    if (v && v.includes('indown.io/fetch')) {
      v = decodeURIComponent(new URL(v).searchParams.get('url'));
    }
    if (v && /cdninstagram\.com|fbcdn\.net/.test(v)) {
      resultUrl = v.replace(/&dl=1$/, '');
      return false; // Break loop
    }
  });

  if (!resultUrl) throw new Error("No media found. The profile might be private or the link is invalid.");

  return {
    media_url: resultUrl,
    type: url.includes('/reel/') ? 'video/reel' : url.includes('/stories/') ? 'story' : 'image/post'
  }
}

/* ================================
   POST → /api/instagram
   body: { url, password }
=============================== */
router.post("/instagram", async (req, res) => {
  try {
    const { url, password } = req.body

    // Security Check
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

    // URL Check
    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Provide Instagram url in request body"
      })
    }

    var result = await instagram(url)

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

expor
t default router
