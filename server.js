const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    optionsSuccessStatus: 200
};

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware para adicionar headers padrão
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota proxy para a API UPC ItemDB
app.get('/api/upc-itemdb/:barcode', async (req, res) => {
    try {
        const { barcode } = req.params;
        const response = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar na API UPC ItemDB:', error.message);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// Rota para outros serviços de API podem ser adicionadas aqui...

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
