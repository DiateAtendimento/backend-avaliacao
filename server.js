require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEETS_URL = process.env.GOOGLE_SHEETS_SCRIPT_URL;
const ORIGIN = process.env.CORS_ORIGIN;

// 1) Conectar ao MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err.message));

// 2) Definir schema/model
const avaliacaoSchema = new mongoose.Schema({
  clareza:       { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
  resolvida:     { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
  tempoResposta: { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
  experienciaGeral: { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
  comentario:    { type: String, maxlength: 500 },
  criadoEm:      { type: Date, default: Date.now }
});
const Avaliacao = mongoose.model('Avaliacao', avaliacaoSchema);

// 3) Middlewares
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// 4) Rota de avaliação
app.post('/api/avaliacao', async (req, res) => {
  const { clareza, resolvida, tempoResposta, experienciaGeral, comentario } = req.body;
  const respostasValidas = ['Excelente','Bom','Regular','Ruim'];

  // Validação
  if (
    !clareza || !resolvida || !tempoResposta || !experienciaGeral ||
    !respostasValidas.includes(clareza) ||
    !respostasValidas.includes(resolvida) ||
    !respostasValidas.includes(tempoResposta) ||
    !respostasValidas.includes(experienciaGeral)
  ) {
    return res.status(400).json({ status: 'erro', mensagem: 'Respostas inválidas ou ausentes.' });
  }
  if (comentario && comentario.length > 500) {
    return res.status(400).json({ status: 'erro', mensagem: 'Comentário muito grande (máx. 500 chars).' });
  }

  // Grava no MongoDB
  try {
    await Avaliacao.create({ clareza, resolvida, tempoResposta, experienciaGeral, comentario });
  } catch(err) {
    console.error('Erro inserindo no Mongo:', err.message);
    // continua mesmo se falhar no Mongo
  }

  // Envia ao Google Sheets
  try {
    const respSheets = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clareza, resolvida, tempoResposta, experienciaGeral, comentario })
    });
    if (!respSheets.ok) {
      const txt = await respSheets.text();
      console.error('Erro no Sheets:', txt);
      return res.status(500).json({ status: 'erro', mensagem: 'Falha no Google Sheets.' });
    }
    return res.status(200).json({ status: 'ok', mensagem: 'Dados gravados com sucesso!' });
  } catch(err) {
    console.error('Erro conectando ao Sheets:', err.message);
    return res.status(500).json({ status: 'erro', mensagem: 'Falha ao conectar ao Google Sheets.' });
  }
});

// 5) Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
