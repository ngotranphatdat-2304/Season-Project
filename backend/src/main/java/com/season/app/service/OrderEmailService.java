package com.season.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.season.app.model.Order;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;

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
            return "[Season Eyewear] Xác nhận đã thanh toán cho đơn hàng #" + order.getId().substring(Math.max(0, order.getId().length() - 6));
        }
        return "[Season Eyewear] Xác nhận đặt hàng thành công #" + order.getId().substring(Math.max(0, order.getId().length() - 6));
    }

    public void sendOrderConfirmationEmail(Order order) {
        if (!isConfigured()) {
            logger.warn("Bỏ qua việc gửi email xác nhận vì cấu hình Gmail OAuth2 chưa đầy đủ.");
            return;
        }

        try {
            String accessToken = fetchAccessToken();
            JavaMailSenderImpl mailSender = createMailSender(accessToken);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(gmailUser, "Season Eyewear");
            helper.setTo(order.getCustomerEmail());
            helper.setSubject(getOrderEmailSubject(order));

            String htmlContent = buildHtmlContent(order);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email xác nhận đơn hàng đã được gửi thành công đến: {}", order.getCustomerEmail());
        } catch (Exception e) {
            logger.error("Lỗi khi gửi email xác nhận cho đơn hàng " + order.getId(), e);
        }
    }

    private String fetchAccessToken() throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        Map<String, String> parameters = Map.of(
                "grant_type", "refresh_token",
                "client_id", gmailClientId,
                "client_secret", gmailClientSecret,
                "refresh_token", gmailRefreshToken
        );

        String form = parameters.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Không thể làm mới Gmail OAuth2 token. HTTP code: " + response.statusCode() + ", Phản hồi: " + response.body());
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode jsonNode = mapper.readTree(response.body());
        return jsonNode.get("access_token").asText();
    }

    private JavaMailSenderImpl createMailSender(String accessToken) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(gmailUser);
        mailSender.setPassword(accessToken);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.auth.mechanisms", "XOAUTH2");
        props.put("mail.debug", "false");

        return mailSender;
    }

    private String buildHtmlContent(Order order) {
        StringBuilder itemsHtml = new StringBuilder();
        for (Order.OrderItem item : order.getItems()) {
            itemsHtml.append("<tr>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #eeeeee;'>")
                    .append("<div style='font-weight: bold;'>").append(item.getProductName()).append("</div>")
                    .append("<div style='font-size: 12px; color: #666666;'>SKU: ").append(item.getVariantSku()).append("</div>")
                    .append("</td>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center;'>")
                    .append(item.getQuantity())
                    .append("</td>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;'>")
                    .append(String.format("%,.0f", item.getUnitPrice())).append(" ").append(order.getCurrency())
                    .append("</td>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;'>")
                    .append(String.format("%,.0f", item.getLineTotal())).append(" ").append(order.getCurrency())
                    .append("</td>")
                    .append("</tr>");
        }

        String paymentMethodText = order.getPaymentMethod() == Order.PaymentMethod.BANK_TRANSFER 
                ? "Thanh toán QR (PayOS)" 
                : "Thanh toán khi nhận hàng (COD)";

        Order.ShippingAddress addr = order.getShippingAddress();
        String fullAddress = (addr.getLine1() != null ? addr.getLine1() : "") +
                (addr.getLine2() != null && !addr.getLine2().trim().isEmpty() ? ", " + addr.getLine2() : "") +
                (addr.getWard() != null && !addr.getWard().trim().isEmpty() ? ", " + addr.getWard() : "") +
                (addr.getDistrict() != null && !addr.getDistrict().trim().isEmpty() ? ", " + addr.getDistrict() : "") +
                (addr.getCity() != null ? ", " + addr.getCity() : "") +
                (addr.getProvince() != null && !addr.getProvince().equals(addr.getCity()) ? ", " + addr.getProvince() : "");

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <title>Xác nhận đơn hàng</title>" +
                "</head>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333333;'>" +
                "  <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>" +
                "    <div style='text-align: center; border-bottom: 2px solid #f1f1f1; padding-bottom: 20px; margin-bottom: 20px;'>" +
                "      <h1 style='font-family: Georgia, serif; font-size: 28px; margin: 0; letter-spacing: 4px; text-transform: uppercase;'>SEASON</h1>" +
                "      <p style='color: #888888; font-size: 14px; margin: 5px 0 0 0;'>Cảm ơn bạn đã mua sắm tại Season Eyewear</p>" +
                "    </div>" +
                "    " +
                "    <h2 style='font-size: 18px; margin-top: 0;'>Xác nhận đơn hàng #" + order.getId().substring(Math.max(0, order.getId().length() - 6)) + "</h2>" +
                "    <p>Xin chào,</p>" +
                "    <p>Chúng tôi đã nhận được đơn hàng của bạn và đang tiến hành chuẩn bị đóng gói. Dưới đây là thông tin chi tiết về đơn hàng:</p>" +
                "    " +
                "    <table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px;'>" +
                "      <thead>" +
                "        <tr style='background-color: #f9f9f9;'>" +
                "          <th style='padding: 10px; border-bottom: 2px solid #dddddd; text-align: left;'>Sản phẩm</th>" +
                "          <th style='padding: 10px; border-bottom: 2px solid #dddddd; text-align: center;'>SL</th>" +
                "          <th style='padding: 10px; border-bottom: 2px solid #dddddd; text-align: right;'>Đơn giá</th>" +
                "          <th style='padding: 10px; border-bottom: 2px solid #dddddd; text-align: right;'>Tổng</th>" +
                "        </tr>" +
                "      </thead>" +
                "      <tbody>" +
                "        " + itemsHtml.toString() +
                "      </tbody>" +
                "    </table>" +
                "    " +
                "    <div style='background-color: #fafafa; padding: 15px; border-radius: 6px; font-size: 14px; margin-bottom: 20px;'>" +
                "      <div style='display: flex; justify-content: space-between; margin-bottom: 8px;'>" +
                "        <span>Tạm tính:</span>" +
                "        <strong style='float: right;'>" + String.format("%,.0f", order.getSubtotalAmount()) + " " + order.getCurrency() + "</strong>" +
                "      </div>" +
                "      <div style='display: flex; justify-content: space-between; margin-bottom: 8px;'>" +
                "        <span>Phí vận chuyển:</span>" +
                "        <strong style='float: right;'>Miễn phí</strong>" +
                "      </div>" +
                "      <hr style='border: none; border-top: 1px solid #eeeeee; margin: 10px 0;'>" +
                "      <div style='display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;'>" +
                "        <span>Tổng thanh toán:</span>" +
                "        <strong style='float: right; color: #111111;'>" + String.format("%,.0f", order.getTotalAmount()) + " " + order.getCurrency() + "</strong>" +
                "      </div>" +
                "    </div>" +
                "    " +
                "    <div style='display: grid; grid-template-columns: 1fr; gap: 15px; font-size: 14px; margin-bottom: 30px; line-height: 1.5;'>" +
                "      <div style='border: 1px solid #eeeeee; padding: 15px; border-radius: 6px;'>" +
                "        <h3 style='margin: 0 0 10px 0; font-size: 15px; border-bottom: 1px solid #f1f1f1; padding-bottom: 5px;'>Thông tin giao hàng</h3>" +
                "        <strong>Người nhận:</strong> " + addr.getRecipientName() + "<br>" +
                "        <strong>Điện thoại:</strong> " + addr.getPhone() + "<br>" +
                "        <strong>Địa chỉ:</strong> " + fullAddress + "<br>" +
                "      </div>" +
                "      <div style='border: 1px solid #eeeeee; padding: 15px; border-radius: 6px; margin-top: 15px;'>" +
                "        <h3 style='margin: 0 0 10px 0; font-size: 15px; border-bottom: 1px solid #f1f1f1; padding-bottom: 5px;'>Phương thức thanh toán</h3>" +
                "        " + paymentMethodText + "<br>" +
                "      </div>" +
                "    </div>" +
                "    " +
                "    <div style='text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 20px;'>" +
                "      <p style='margin: 0;'>Mọi thắc mắc vui lòng liên hệ hotline: <strong>+84 986 009 390</strong> hoặc gửi email về support@season.vn</p>" +
                "      <p style='margin: 5px 0 0 0;'>© " + java.time.LocalDate.now().getYear() + " Season Eyewear. All rights reserved.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }

    private boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}