package com.season.app.service;

import com.season.app.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OrderEmailService {
    private static final Logger logger = LoggerFactory.getLogger(OrderEmailService.class);
    private final String gmailUser;
    private final String gmailClientId;
    private final String gmailClientSecret;
    private final String gmailRefreshToken;

    public OrderEmailService(
            @Value("${spring.mail.username:}") String gmailUser,
            @Value("${app.gmail.client-id:}") String gmailClientId,
            @Value("${app.gmail.client-secret:}") String gmailClientSecret,
            @Value("${app.gmail.refresh-token:}") String gmailRefreshToken
    ) {
        this.gmailUser = gmailUser;
        this.gmailClientId = gmailClientId;
        this.gmailClientSecret = gmailClientSecret;
        this.gmailRefreshToken = gmailRefreshToken;
    }

    public boolean isConfigured() {
        return notBlank(gmailUser)
                && notBlank(gmailClientId)
                && notBlank(gmailClientSecret)
                && notBlank(gmailRefreshToken);
    }

    public String getOrderEmailSubject(Order order) {
        if (order.getPaymentMethod() == Order.PaymentMethod.BANK_TRANSFER
                || order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            return "Payment received " + order.getId();
        }
        return "Order confirmation " + order.getId();
    }

    public void sendOrderConfirmationEmail(Order order) {
        if (isConfigured() == false) {
            logger.warn("Skipping order confirmation email because Gmail OAuth2 config is missing.");
            return;
        }
        // TODO: complete Gmail OAuth2 send flow for Spring Boot.
        logger.info("Order confirmation email task queued for order {}", order.getId());
    }

    private boolean notBlank(String value) {
        return value != null && value.trim().isEmpty() == false;
    }
}

