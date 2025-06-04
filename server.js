// server.js

const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

// Permite ler JSON do corpo das requisições
app.use(express.json());

// Endpoint para receber o POST do seu formulário
app.post('/api/avaliacao', async (req, res) => {
  try {
    const dados = req.body;

    // Faz o POST para o seu Google Apps Script
    const resposta = await fetch('https://script.google.com/macros/s/AKfycbwm_NNASjUjQwXbpGeNqlB4dj-6uyWJ28DYY50LzdwXwz8KqQm6SnKE74dhI1wWcroZ/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();
    res.status(200).json({ status: 'ok', backend: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'erro', mensagem: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});