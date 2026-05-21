require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Rota de Boas-vindas
app.get('/api', (req, res) => {
    res.json({ mensagem: '🔥 Bem-vindo à API do Arraiá na Vercel! O quentão tá no fogo! 🔥' });
});

// Rota 1: Listar todo o cardápio
app.get('/api/produtos', async (req, res) => {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

    if (error) {
        return res.status(500).json({ erro: 'Deu ruim na panela: ' + error.message });
    }
    
    res.status(200).json(data);
});

// Rota 2: Adicionar um novo produto (POST)
app.post('/api/produtos', async (req, res) => {
    const { nome, descricao, preco } = req.body;

    const { data, error } = await supabase
        .from('produtos')
        .insert([{ nome, descricao, preco }])
        .select();

    if (error) {
        return res.status(400).json({ erro: 'Não deu pra anotar: ' + error.message });
    }

    res.status(201).json({ mensagem: 'Produto adicionado com sucesso!', produto: data });
});

// EXPORTAR O APP (Obrigatório para a Vercel)
module.exports = app;