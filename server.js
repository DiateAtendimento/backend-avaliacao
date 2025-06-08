require('dotenv').config();
const express = require('express');
const cors = require('cors');
// dynamic-import do node-fetch (v3+)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEETS_URL = process.env.GOOGLE_SHEETS_SCRIPT_URL;
const ORIGIN = process.env.CORS_ORIGIN;

// 1) Descobrir IP de saída do Render
(async () => {
  try {
    const { ip } = await fetch('https://api.ipify.org?format=json').then(r => r.json());
    console.log('Meu IP de saída atual é:', ip);
  } catch (e) {
    console.warn('Não consegui descobrir o IP de saída:', e);
  }
})();

// 2) Conectar ao MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err.message));

// 3) Schema/Model
 const avaliacaoSchema = new mongoose.Schema({
   clareza:       { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
   resolvida:     { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
   tempoResposta: { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
   experienciaGeral: { type: String, enum: ['Excelente','Bom','Regular','Ruim'], required: true },
   comentario:    { type: String, maxlength: 500 },
   criadoEm:      { type: Date, default: Date.now },
   criadoEmLocal: { 
     type: String, 
     default: () => new Date().toLocaleString('pt-BR', {
       timeZone: 'America/Sao_Paulo',
       hour12: false,
       year: 'numeric', month: '2-digit', day: '2-digit',
       hour: '2-digit', minute: '2-digit', second: '2-digit'
     })
   }
 });

const Avaliacao = mongoose.model('Avaliacao', avaliacaoSchema);

// 4) Middlewares
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// 5) Endpoint
app.post('/api/avaliacao', async (req, res) => {
  const { clareza, resolvida, tempoResposta, experienciaGeral, comentario } = req.body;
  const respostasValidas = ['Excelente','Bom','Regular','Ruim'];

  // validações...
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
    return res.status(400).json({ status: 'erro', mensagem: 'Comentário muito grande.' });
  }

  // grava no Mongo
  try {
    await Avaliacao.create({ clareza, resolvida, tempoResposta, experienciaGeral, comentario });
  } catch (err) {
    console.error('Erro inserindo no Mongo:', err.message);
  }

  // envia ao Sheets
  try {
    const resp = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clareza, resolvida, tempoResposta, experienciaGeral, comentario })
    });
    if (!resp.ok) throw new Error(await resp.text());
    return res.json({ status: 'ok', mensagem: 'Dados gravados com sucesso!' });
  } catch (err) {
    console.error('Erro no Google Sheets:', err.message);
    return res.status(500).json({ status: 'erro', mensagem: 'Falha no Google Sheets.' });
  }
});

// 6) Start
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
