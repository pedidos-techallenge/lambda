const {
    CognitoIdentityProviderClient,
    ListUsersCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const clientId = process.env.COGNITO_CLIENT_ID;
const cognitoDomain = process.env.COGNITO_DOMAIN;
const redirectUri = process.env.COGNITO_REDIRECT_URI;

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });

function validateCPF(cpf) {
    // const cpfRegex = /^\d{11}$/;
    // return cpfRegex.test(cpf);
    return true;
}

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    const cognitoUrl = `https://${cognitoDomain}.auth.us-east-1.amazoncognito.com/login?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;


    // Verify if CPF is in the body
    const cpf = requestBody && requestBody.cpf ? requestBody.cpf : null;

    if (cpf != null) {
        console.log("DIFERENTE DE NULL AAAAAAAAAAAAA")

        if (validateCPF(cpf)) {
            console.log("CPF VALIDO AAAAAAAAAAAAAA")
            // Login
            try {
                const params = {
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    Filter: `username = "${cpf}"`,
                };
                
                const command = new ListUsersCommand(params);
                const result = await cognitoClient.send(command);
        
                if (result.Users.length > 0) {
                    // CPF is valid, go to cognito authentication
                    console.log("achou o usuario aaaaaaaaaaaaaaaaaaaaaaaa")
                    return {
                        statusCode: 302,
                        headers: {
                            Location: cognitoUrl,
                        },
                        body: JSON.stringify({
                            message: 'Redirecting to Cognito for authentication...',
                        }),
                    };
                } else {
                    console.log("não achou o usuario aaaaaaaaaaaaaaaaaaaaaaaa")
                    return {
                        statusCode: 401,
                        body: JSON.stringify({
                            message: 'CPF supplied is not in the database.',
                            error: error.message,
                        }),
                    }
                }
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
            console.log("cpf invalidoooooooooooo")
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'CPF is invalid.',
                    error: error.message,
                }),
            }
        }
    } else {
        // Client not identified, do not login, go to application direclty
        return {
            statusCode: 302,
            headers: {
                Location: 'https://pudim.com.br',
            },
            body: JSON.stringify({
                message: 'Redirecting to application...',
            }),
        };
    }
};
