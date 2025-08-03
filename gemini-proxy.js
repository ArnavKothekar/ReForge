const express = require('express');
const fetch = require('node-fetch');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Replace with your Gemini API key
const GEMINI_API_KEY = 'AIzaSyA72F6z090N5zZHNNvcl_FMtlbvSQqBVNo';


app.use(cors());
app.use(express.json());

app.post('/gemini', async (req, res) => {
  const { prompt, model = "gemini-pro" } = req.body;
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    // Extract the text from the Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy server running at http://localhost:${PORT}`);
});


