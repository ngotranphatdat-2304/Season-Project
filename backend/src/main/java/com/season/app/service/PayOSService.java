package com.season.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PayOSService {
    private final String backendPublicBaseUrl;
    private final String frontendPublicBaseUrl;
    private final String webhookPath;

    public PayOSService(
            @Value("${app.backend.public-base-url:}") String backendPublicBaseUrl,
            @Value("${app.frontend.public-base-url:}") String frontendPublicBaseUrl,
            @Value("${app.payos.webhook-path:/api/checkout/payos/webhook}") String webhookPath
    ) {
        this.backendPublicBaseUrl = backendPublicBaseUrl;
        this.frontendPublicBaseUrl = frontendPublicBaseUrl;
        this.webhookPath = webhookPath;
    }

    public String getPayOSWebhookUrl() {
        if (backendPublicBaseUrl == null || backendPublicBaseUrl.trim().isEmpty()) {
            throw new PayOSServiceError("BACKEND_PUBLIC_BASE_URL is required for PayOS", 503);
        }
        return trimTrailingSlash(backendPublicBaseUrl) + webhookPath;
    }

    public String buildPaymentResultUrl(String token, String orderId) {
        if (frontendPublicBaseUrl == null || frontendPublicBaseUrl.trim().isEmpty()) {
            throw new PayOSServiceError("FRONTEND_PUBLIC_BASE_URL is required for PayOS", 503);
        }
        return trimTrailingSlash(frontendPublicBaseUrl)
                + "/checkout/payment-result?token=" + token + "&orderId=" + orderId;
    }

    public String mapPayOSStatus(String status) {
        if ("PAID".equals(status)
                || "PENDING".equals(status)
                || "CANCELLED".equals(status)
                || "FAILED".equals(status)
                || "EXPIRED".equals(status)
                || "PROCESSING".equals(status)
                || "UNDERPAID".equals(status)) {
            return status;
        }
        return "PENDING";
    }

    private String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }

    public static class PayOSServiceError extends RuntimeException {
        private final int statusCode;

        public PayOSServiceError(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}

