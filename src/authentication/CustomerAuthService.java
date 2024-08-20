package main.java.com.techchallenge.authentication;

public class CustomerAuthService {

    private final CustomerService customerService; // vinda do outro repositório

    public CustomerAuthService(CustomerService customerService) {
        this.customerService = customerService;
    }

    public boolean authenticateCustomer(String cpf) {
        return customerService.isValidCustomer(cpf); // Exemplo de chamada ao serviço do cliente
    }
}