package main.java.com.techchallenge.authentication;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import java.util.Map;

public class ClientAuthLambdaHandler implements RequestHandler<Map<String, Object>, String> {

    private final CustomerAuthService authService;

    public ClientAuthLambdaHandler() {
        this.authService = new CustomerAuthService(); // ou injete via DI
    }

    @Override
    public String handleRequest(Map<String, Object> input, Context context) {
        String cpf = (String) input.get("cpf");
        boolean isAuthenticated = authService.authenticateCustomer(cpf);
        return isAuthenticated ? "Authenticated" : "Not Authenticated";
    }
}

