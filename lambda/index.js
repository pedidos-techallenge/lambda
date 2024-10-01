const AWS = require('aws-sdk');
const { cp } = require('fs');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: 'us-east-1'
});

const clientId = process.env.COGNITO_CLIENT_ID;
const cognitoDomain = process.env.COGNITO_DOMAIN;
const redirectUri = process.env.COGNITO_REDIRECT_URI;
const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID

//const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });

// const clientId="2irn4ti87780cmv6v5fndebbn8"
// const cognitoDomain="https://pos-tech-challenge.auth.us-east-1.amazoncognito.com"
// const redirectUri="https://github.com/queirozingrid"
// const cognitoUserPoolId="us-east-1_aUa1CwVit"


function validateCPF(cpf) {
    const cpfRegex = /^\d{11}$/;
    return cpfRegex.test(cpf);
}

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    var cpf = null;

    if (requestBody != null && 'cpf' in requestBody) {
        cpf = requestBody.cpf;
    }

    const cognitoUrl = `https://${cognitoDomain}.auth.us-east-1.amazoncognito.com/login?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;

    if (cpf != null) {
        const cpfString = String(cpf)

        isValid = validateCPF(cpfString)
        if (isValid) {
            console.log("CPF VALIDO AAAAAAAAAAAAAA")
            // Login
            try {
                const params = {
                    UserPoolId: cognitoUserPoolId,
                    Username: cpfString,
                };
                
                console.log("Params: ", params)

                const data = await cognitoIdentityServiceProvider.adminGetUser(params).promise();

                console.log("Data: ", data)

                if (data) {
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
                            error: 'CPF supplied is not in the database.',
                        }),
                    }
                }
            } catch (error) {
                console.log("erro: ", error)
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: 'Failed to conect to cognito.',
                        error: 'Failed to conect to cognito.   ' + error,
                    }),
                };
            }
        } else {
            console.log("cpf invalidoooooooooooo")
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'CPF is invalid.',
                    error: 'CPF is invalid.',
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