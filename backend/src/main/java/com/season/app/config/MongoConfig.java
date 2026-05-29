package com.season.app.config;

import com.season.app.model.CheckoutSession;
import com.season.app.model.Order;
import com.season.app.model.Product;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.Arrays;

@Configuration
@EnableMongoAuditing // Bắt buộc phải có annotation này để @CreatedDate hoạt động
public class MongoConfig {
    
    @Bean
    MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }

    // Hàm tiện ích giúp parse các Enum an toàn (không phân biệt hoa/thường)
    private static <T extends Enum<T>> T parseEnum(Class<T> enumType, String source, T defaultValue) {
        if (source == null) return defaultValue;
        for (T e : enumType.getEnumConstants()) {
            if (e.name().equalsIgnoreCase(source)) {
                return e;
            }
        }
        return defaultValue;
    }

    // Đăng ký bộ dịch tùy chỉnh (Custom Converters) để Spring Data đọc hiểu JSON DB
    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
            // 1. ProductType
            new Converter<String, Product.ProductType>() {
                @Override public Product.ProductType convert(String source) { 
                    try { return Product.ProductType.fromValue(source); } catch(Exception e) { return Product.ProductType.EYEGLASSES; }
                }
            },
            new Converter<Product.ProductType, String>() {
                @Override public String convert(Product.ProductType source) { return source.getValue(); }
            },

            // 2. ProductAvailability
            new Converter<String, Product.ProductAvailability>() {
                @Override public Product.ProductAvailability convert(String source) { 
                    try { return Product.ProductAvailability.fromValue(source); } catch(Exception e) { return Product.ProductAvailability.IN_STOCK; }
                }
            },
            new Converter<Product.ProductAvailability, String>() {
                @Override public String convert(Product.ProductAvailability source) { return source.getValue(); }
            },

            // 3. OrderStatus
            new Converter<String, Order.OrderStatus>() {
                @Override public Order.OrderStatus convert(String source) { 
                    try { return Order.OrderStatus.fromValue(source); } catch(Exception e) { return Order.OrderStatus.PENDING; }
                }
            },
            new Converter<Order.OrderStatus, String>() {
                @Override public String convert(Order.OrderStatus source) { return source.getValue(); }
            },

            // 4. PaymentStatus
            new Converter<String, Order.PaymentStatus>() {
                @Override public Order.PaymentStatus convert(String source) { 
                    try { return Order.PaymentStatus.fromValue(source); } catch(Exception e) { return Order.PaymentStatus.UNPAID; }
                }
            },
            new Converter<Order.PaymentStatus, String>() {
                @Override public String convert(Order.PaymentStatus source) { return source.getValue(); }
            },

            // 5. PaymentMethod
            new Converter<String, Order.PaymentMethod>() {
                @Override public Order.PaymentMethod convert(String source) { 
                    try { return Order.PaymentMethod.fromValue(source); } catch(Exception e) { return Order.PaymentMethod.CASH_ON_DELIVERY; }
                }
            },
            new Converter<Order.PaymentMethod, String>() {
                @Override public String convert(Order.PaymentMethod source) { return source.getValue(); }
            },

            // 6. CheckoutSessionStatus
            new Converter<String, CheckoutSession.CheckoutSessionStatus>() {
                @Override public CheckoutSession.CheckoutSessionStatus convert(String source) { 
                    try { return CheckoutSession.CheckoutSessionStatus.fromValue(source); } catch(Exception e) { return CheckoutSession.CheckoutSessionStatus.PENDING; }
                }
            },
            new Converter<CheckoutSession.CheckoutSessionStatus, String>() {
                @Override public String convert(CheckoutSession.CheckoutSessionStatus source) { return source.getValue(); }
            },

            // 7. Các Enum cơ bản (bỏ qua lỗi viết hoa/viết thường)
            new Converter<String, Product.FrameMaterial>() {
                @Override public Product.FrameMaterial convert(String source) { return parseEnum(Product.FrameMaterial.class, source, Product.FrameMaterial.Acetate); }
            },
            new Converter<String, Product.FrameSize>() {
                @Override public Product.FrameSize convert(String source) { return parseEnum(Product.FrameSize.class, source, Product.FrameSize.Medium); }
            },
            new Converter<String, Product.ProductGender>() {
                @Override public Product.ProductGender convert(String source) { return parseEnum(Product.ProductGender.class, source, Product.ProductGender.Unisex); }
            }
        ));
    }
}