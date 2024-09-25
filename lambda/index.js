//const AWS = require('aws-sdk');

const clientId = process.env.COGNITO_CLIENT_ID;
const cognitoDomain = process.env.COGNITO_DOMAIN;
const redirectUri = process.env.COGNITO_REDIRECT_URI;

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    const cognitoUrl = `https://${cognitoDomain}.auth.us-east-1.amazoncognito.com/login?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;


    // Verify if CPF is in the body
    const cpf = requestBody && requestBody.cpf ? requestBody.cpf : null;

    if (cpf != null) {
        try {
            return {
                statusCode: 302,
                headers: {
                    Location: cognitoUrl,
                },
                body: JSON.stringify({
                    message: 'Redirecting to cognito authentication...',
                }),
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Failed to conect to cognito.',
                    error: error.message,
                }),
            };
        }
    } else {
        // Se não houver CPF, redireciona diretamente para a aplicação
        return {
            statusCode: 302,
            headers: {
                Location: 'https://pudim.com', // URL da aplicação
            },
            body: JSON.stringify({
                message: 'Redirecting to application...',
            }),
        };
    }
};
