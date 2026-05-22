
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.json({
    mensagem: '🔥 API funcionando na Vercel 🔥'
  });
});

app.get('/produtos', async (req, res) => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*');

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  res.json(data);
});

module.exports = app;
