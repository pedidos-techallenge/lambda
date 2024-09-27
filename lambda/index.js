const {
    CognitoIdentityProviderClient,
    ListUsersCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const clientId = process.env.COGNITO_CLIENT_ID;
const cognitoDomain = process.env.COGNITO_DOMAIN;
const redirectUri = process.env.COGNITO_REDIRECT_URI;
const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-1" });

function validateCPF(cpf) {
    // cpf = "12345678911"
    const cpfRegex = /^\d{11}$/;
    return cpfRegex.test(cpf);
}

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    var cpf = null;
    if (cpf in requestBody) {
        cpf = requestBody.cpf;
    }

    const cognitoUrl = `https://${cognitoDomain}.auth.us-east-1.amazoncognito.com/login?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;

    if (cpf != null) {
        const cpfString = String(cpf)
        console.log("DIFERENTE DE NULL AAAAAAAAAAAAA")

        console.log("cpf string aaaaaaaaaaaaaaaaaa ========= ", cpfString)
        isValid = validateCPF(cpfString)
        if (isValid) {
            console.log("CPF VALIDO AAAAAAAAAAAAAA")
            // Login
            try {
                const params = {
                    UserPoolId: cognitoUserPoolId,
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
                            error: 'CPF supplied is not in the database.',
                        }),
                    }
                }
            } catch (error) {
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
