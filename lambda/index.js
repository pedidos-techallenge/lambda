const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  // Caminho para o arquivo HTML
  const filePath = path.join(__dirname, 'index.html');

  // Leitura do arquivo HTML
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Erro ao ler o arquivo HTML:', err);
    return {
      statusCode: 500,
      body: 'Erro interno ao carregar a página.',
    };
  }

  // Resposta HTTP com o conteúdo do HTML
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: htmlContent,
  };

  return response;
};
