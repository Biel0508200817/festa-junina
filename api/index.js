require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// 🔥 ROTAS ATUALIZADAS 🔥
// ==========================================

// Rota Raiz (Agora funciona direto no link principal da Vercel!)
app.get('/', (req, res) => {
    res.status(200).json({ mensagem: '🔥 O Arraiá tá ON na Vercel! 🔥' });
});

// Rota de Produtos
app.get('/produtos', async (req, res) => {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

    if (error) {
        return res.status(500).json({ erro: 'Deu ruim na panela: ' + error.message });
    }
    
    res.status(200).json(data);
});

// Rota de Adicionar Produto
app.post('/produtos', async (req, res) => {
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

module.exports = app;
