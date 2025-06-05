const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/avaliacao', async (req, res) => {
  // Validação dos campos obrigatórios
  const { clareza, resolvida, tempoResposta, experienciaGeral, comentario } = req.body;

  const respostasValidas = ['Excelente', 'Bom', 'Regular', 'Ruim'];

  if (
    !clareza || !resolvida || !tempoResposta || !experienciaGeral ||
    !respostasValidas.includes(clareza) ||
    !respostasValidas.includes(resolvida) ||
    !respostasValidas.includes(tempoResposta) ||
    !respostasValidas.includes(experienciaGeral)
  ) {
    return res.status(400).json({ status: 'erro', mensagem: 'Respostas obrigatórias inválidas ou ausentes.' });
  }

  if (comentario && comentario.length > 500) {
    return res.status(400).json({ status: 'erro', mensagem: 'Comentário muito grande (máximo 500 caracteres).' });
  }

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
