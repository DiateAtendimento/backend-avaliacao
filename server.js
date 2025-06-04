const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/avaliacao', async (req, res) => {
  try {
    const dados = req.body;

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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});