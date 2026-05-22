require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// ========================================
// HOME
// ========================================

app.get('/', (req, res) => {
  res.json({
    api: '🌽 API Festa Junina Online 🔥',
    version: '3.0.0',
    status: 'online'
  });
});


// ========================================
// LOGIN ADMIN
// ========================================

app.post('/login', async (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email obrigatório'
    });
  }

  const token = jwt.sign(
    {
      email,
      admin: true
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );

  res.json({
    success: true,
    token
  });

});


// ========================================
// MIDDLEWARE AUTH
// ========================================

function auth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      error: 'Token não enviado'
    });
  }

  try {

    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch {

    return res.status(401).json({
      error: 'Token inválido'
    });

  }

}


// ========================================
// CONFIGURAÇÕES
// ========================================

app.get('/configuracoes', async (req, res) => {

  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);

});


// ========================================
// CATEGORIAS
// ========================================

app.get('/categorias/:id', async (req, res) => {

  try {

    const id = Number(req.params.id);

    const categorias = {
      1: 'salgados',
      2: 'doces',
      3: 'bebidas'
    };

    const categoria = categorias[id];

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoria não encontrada'
      });
    }

    // BUSCA NO SUPABASE
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .ilike('categoria', categoria);

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      categoria,
      total: data.length,
      produtos: data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ========================================
// PRODUTOS
// ========================================

app.get('/produtos', async (req, res) => {

  const { categoria } = req.query;

  let query = supabase
    .from('produtos')
    .select(`
      *,
      categorias (
        id,
        nome
      )
    `)
    .eq('disponivel', true)
    .order('id', { ascending: true });

  if (categoria) {
    query = query.eq('categoria_id', categoria);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    total: data.length,
    produtos: data
  });

});


// ========================================
// PRODUTO POR ID
// ========================================

app.get('/produtos/:id', async (req, res) => {

  const { data, error } = await supabase
    .from('produtos')
    .select(`
      *,
      categorias (
        id,
        nome
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) {
    return res.status(404).json({
      error: 'Produto não encontrado'
    });
  }

  res.json(data);

});


// ========================================
// PRODUTO DESTAQUE
// ========================================

app.get('/destaques', async (req, res) => {

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('destaque', true)
    .eq('disponivel', true);

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);

});


// ========================================
// CRIAR PRODUTO
// ========================================

app.post('/produtos', auth, async (req, res) => {

  const {
    categoria_id,
    nome,
    descricao,
    preco,
    imagem,
    estoque,
    destaque
  } = req.body;

  const { data, error } = await supabase
    .from('produtos')
    .insert([
      {
        categoria_id,
        nome,
        descricao,
        preco,
        imagem,
        estoque,
        destaque
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.status(201).json({
    success: true,
    produto: data
  });

});


// ========================================
// EDITAR PRODUTO
// ========================================

app.put('/produtos/:id', auth, async (req, res) => {

  const {
    categoria_id,
    nome,
    descricao,
    preco,
    imagem,
    estoque,
    destaque,
    disponivel
  } = req.body;

  const { data, error } = await supabase
    .from('produtos')
    .update({
      categoria_id,
      nome,
      descricao,
      preco,
      imagem,
      estoque,
      destaque,
      disponivel
    })
    .eq('id', req.params.id)
    .select();

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.json({
    success: true,
    produto: data
  });

});


// ========================================
// DELETAR PRODUTO
// ========================================

app.delete('/produtos/:id', auth, async (req, res) => {

  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.json({
    success: true,
    message: 'Produto removido'
  });

});


// ========================================
// PEDIDOS
// ========================================

app.post('/pedidos', async (req, res) => {

  const {
    usuario_id,
    total,
    forma_pagamento,
    observacao,
    itens
  } = req.body;

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert([
      {
        usuario_id,
        total,
        forma_pagamento,
        observacao
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  const itensFormatados = itens.map(item => ({
    pedido_id: pedido.id,
    produto_id: item.produto_id,
    quantidade: item.quantidade,
    preco: item.preco
  }));

  await supabase
    .from('pedido_itens')
    .insert(itensFormatados);

  res.status(201).json({
    success: true,
    pedido
  });

});


// ========================================
// LISTAR PEDIDOS
// ========================================

app.get('/pedidos', auth, async (req, res) => {

  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      pedido_itens (
        *,
        produtos (
          nome,
          imagem
        )
      )
    `)
    .order('id', { ascending: false });

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);

});


// ========================================
// CUPONS
// ========================================

app.post('/validar-cupom', async (req, res) => {

  const { codigo } = req.body;

  const { data, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('codigo', codigo)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return res.status(404).json({
      valido: false
    });
  }

  res.json({
    valido: true,
    cupom: data
  });

});


// ========================================
// AVALIAÇÕES
// ========================================

app.post('/avaliacoes', async (req, res) => {

  const {
    usuario_id,
    produto_id,
    nota,
    comentario
  } = req.body;

  const { data, error } = await supabase
    .from('avaliacoes')
    .insert([
      {
        usuario_id,
        produto_id,
        nota,
        comentario
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.json(data);

});


// ========================================
// FAVORITOS
// ========================================

app.post('/favoritos', async (req, res) => {

  const {
    usuario_id,
    produto_id
  } = req.body;

  const { data, error } = await supabase
    .from('favoritos')
    .insert([
      {
        usuario_id,
        produto_id
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.json(data);

});


// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
});


// ========================================
// EXPORT
// ========================================

module.exports = app;
