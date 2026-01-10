import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

/* ================================
   INSTAGRAM FUNCTION
================================ */
const instagram = async (url) => {
  if (!url || !url.includes("instagram.com")) {
    throw new Error("A valid Instagram URL is required");
  }

  // Step 1: Get CSRF Token and Cookies
  const getPage = await axios.get('https://indown.io/en1', {
    headers: { 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
    }
  });
  
  const cookies = getPage.headers['set-cookie']?.map(v => v.split(';')[0]).join('; ');
  const $initial = cheerio.load(getPage.data);
  const token = $initial('input[name="_token"]').val();

  if (!token) throw new Error("Could not fetch security token from provider");

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
      try {
        v = decodeURIComponent(new URL(v).searchParams.get('url'));
      } catch (err) { /* ignore */ }
    }
    if (v && /cdninstagram\.com|fbcdn\.net/.test(v)) {
      resultUrl = v.replace(/&dl=1$/, '');
      return false; // Break loop
    }
  });

  if (!resultUrl) throw new Error("No media found or content is private");

  return {
    media_url: resultUrl,
    type: url.includes('/reel/') ? 'reel' : url.includes('/stories/') ? 'story' : 'post'
  };
};

/* ================================
   POST → /api/instagram
================================ */
router.post("/instagram", async (req, res) => {
  try {
    const { url, password } = req.body;

    // Security Check
    if (!password || password !== "eypz-pvt") {
      return res.status(403).json({
        status: false,
        message: "Invalid or missing password"
      });
    }

    // URL Check
    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Instagram URL is required in request body"
      });
    }

    const result = await instagram(url);

    res.json({
      status: true,
      creator: "Akshay-Eypz",
      result: result
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
});

// FIXED: Correct export statement
export default router;
