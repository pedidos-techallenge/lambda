const AWS = require('aws-sdk');
const { cp } = require('fs');
const { stringify } = require('querystring');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: 'us-east-1'
});

const clientId = process.env.COGNITO_CLIENT_ID;
const cognitoDomain = process.env.COGNITO_DOMAIN;
const redirectUri = process.env.COGNITO_REDIRECT_URI;
const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;

const cognitoUrl = `https://${cognitoDomain}.auth.us-east-1.amazoncognito.com/login?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`;

function validateCPF(cpf) {
    const cpfRegex = /^\d{11}$/;
    return cpfRegex.test(cpf);
}

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);
    const httpMethod = event.httpMethod;
    var cpf = null;
    var cpfString;
    var email = "";

    if (requestBody != null && 'cpf' in requestBody) {
        cpf = requestBody.cpf;
        cpfString = String(cpf)
        
    }

    if (requestBody != null && 'email' in requestBody) {
        email = requestBody.email;
    }

    var userPassword = "";
    if (requestBody != null && 'password' in requestBody) {
        userPassword = requestBody.password
    }

    if (httpMethod === "POST" && event.path === "/pedidos/application/register") {

        if (cpf != null) {

            isCPFValid = validateCPF(cpf)
            if (!isCPFValid) {
                return {
                    statusCode: 400,
                    headers: {
                        Location: cognitoUrl,
                    },
                    body: JSON.stringify({
                        message: 'Invalid CPF',
                    }),
                };
            }

            const validateParams = {
                UserPoolId: cognitoUserPoolId,
                Username: cpfString,
            };

            try {
                const registerData = await cognitoIdentityServiceProvider.adminGetUser(validateParams).promise();
                if (registerData) {
                    return {
                        statusCode: 400,
                        headers: {
                            Location: cognitoUrl,
                        },
                        body: JSON.stringify({
                            message: 'User with this CPF already exists...',
                        }),
                    };
                } else {

                    var registerParams = {
                        ClientId: clientId,
                        Username: cpfString,
                        Password: userPassword,
                        UserAttributes: [
                            {
                                Name: 'email',
                                Value: email,
                            },
                        ],
                    };
                }
            } catch (error) {
                if (error.code === 'UserNotFoundException') {
                    var registerParams = {
                        ClientId: clientId,
                        Username: cpfString,
                        Password: userPassword,
                        UserAttributes: [
                            {
                                Name: 'email',
                                Value: email,
                            },
                        ],
                    };
                }
            }

            try {
                const registerResponse = await cognitoIdentityServiceProvider.signUp(registerParams).promise();
                return {
                    statusCode: 200,
                    headers: {
                        Location: cognitoUrl,
                    },
                    body: JSON.stringify({
                        message: 'Redirecting to Cognito for authentication...',
                    }),
                }
            } catch (error) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: 'Failed to conect to cognito.',
                        error: 'Failed to conect to cognito.   ' + error,
                    }),
                }   
            }
        } else {
            return {
                statusCode: 400,
                headers: {
                    Location: cognitoUrl,
                },
                body: JSON.stringify({
                    message: 'Missing CPF',
                }),
            };
        }
    }

    // Try to authenticate
    else if (httpMethod === "POST" && event.path === "/pedidos/application/cpf") {
        console.log("aaaaaaaaaaaaaa: ")
        if (cpf != null) {

            isValid = validateCPF(cpfString)
            if (isValid) {
                // Login
                try {
                    const params = {
                        UserPoolId: cognitoUserPoolId,
                        Username: cpfString,
                    };

                    const data = await cognitoIdentityServiceProvider.adminGetUser(params).promise();

                    if (data) {
                        // CPF is valid, go to cognito authentication
                        return {
                            statusCode: 200,
                            headers: {
                                Location: cognitoUrl,
                            },
                            body: JSON.stringify({
                                message: 'Redirecting to Cognito for authentication...',
                            }),
                        };
                    }
                } catch (error) {
                    console.log("erro: ", error)
                    if (error.code === 'UserNotFoundException') {
                        return {
                            statusCode: 401,
                            body: JSON.stringify({
                                message: 'CPF supplied is not in the database.',
                                error: 'CPF supplied is not in the database.',
                            }),
                        }
                    } else {
                        return {
                            statusCode: 500,
                            body: JSON.stringify({
                                message: 'Failed to conect to cognito.',
                                error: 'Failed to conect to cognito.   ' + error,
                            }),
                        };
                    }
                }
            
            } else {
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
    }
};