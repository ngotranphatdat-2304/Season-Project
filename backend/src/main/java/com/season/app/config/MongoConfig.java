package com.season.app.config;

import com.season.app.model.CheckoutSession;
import com.season.app.model.Order;
import com.season.app.model.Product;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.Arrays;

@Configuration
@EnableMongoAuditing
public class MongoConfig {
    
    @Bean
    MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }

    private static <T extends Enum<T>> T parseEnum(Class<T> enumType, String source, T defaultValue) {
        if (source == null) return defaultValue;
        for (T e : enumType.getEnumConstants()) {
            if (e.name().equalsIgnoreCase(source)) {
                return e;
            }
        }
        return defaultValue;
    }

    // --- 1. ProductType ---
    @ReadingConverter
    public static class StringToProductTypeConverter implements Converter<String, Product.ProductType> {
        @Override public Product.ProductType convert(String source) { try { return Product.ProductType.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class ProductTypeToStringConverter implements Converter<Product.ProductType, String> {
        @Override public String convert(Product.ProductType source) { return source.getValue(); }
    }

    // --- 2. ProductAvailability ---
    @ReadingConverter
    public static class StringToProductAvailabilityConverter implements Converter<String, Product.ProductAvailability> {
        @Override public Product.ProductAvailability convert(String source) { try { return Product.ProductAvailability.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class ProductAvailabilityToStringConverter implements Converter<Product.ProductAvailability, String> {
        @Override public String convert(Product.ProductAvailability source) { return source.getValue(); }
    }

    // --- 3. OrderStatus ---
    @ReadingConverter
    public static class StringToOrderStatusConverter implements Converter<String, Order.OrderStatus> {
        @Override public Order.OrderStatus convert(String source) { try { return Order.OrderStatus.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class OrderStatusToStringConverter implements Converter<Order.OrderStatus, String> {
        @Override public String convert(Order.OrderStatus source) { return source.getValue(); }
    }

    // --- 4. PaymentStatus ---
    @ReadingConverter
    public static class StringToPaymentStatusConverter implements Converter<String, Order.PaymentStatus> {
        @Override public Order.PaymentStatus convert(String source) { try { return Order.PaymentStatus.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class PaymentStatusToStringConverter implements Converter<Order.PaymentStatus, String> {
        @Override public String convert(Order.PaymentStatus source) { return source.getValue(); }
    }

    // --- 5. PaymentMethod ---
    @ReadingConverter
    public static class StringToPaymentMethodConverter implements Converter<String, Order.PaymentMethod> {
        @Override public Order.PaymentMethod convert(String source) { try { return Order.PaymentMethod.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class PaymentMethodToStringConverter implements Converter<Order.PaymentMethod, String> {
        @Override public String convert(Order.PaymentMethod source) { return source.getValue(); }
    }

    // --- 6. CheckoutSessionStatus ---
    @ReadingConverter
    public static class StringToCheckoutSessionStatusConverter implements Converter<String, CheckoutSession.CheckoutSessionStatus> {
        @Override public CheckoutSession.CheckoutSessionStatus convert(String source) { try { return CheckoutSession.CheckoutSessionStatus.fromValue(source); } catch(Exception e) { return null; } }
    }
    @WritingConverter
    public static class CheckoutSessionStatusToStringConverter implements Converter<CheckoutSession.CheckoutSessionStatus, String> {
        @Override public String convert(CheckoutSession.CheckoutSessionStatus source) { return source.getValue(); }
    }

    // --- 7. Các Enum cơ bản ---
    @ReadingConverter
    public static class StringToFrameMaterialConverter implements Converter<String, Product.FrameMaterial> {
        @Override public Product.FrameMaterial convert(String source) { return parseEnum(Product.FrameMaterial.class, source, null); }
    }
    @ReadingConverter
    public static class StringToFrameSizeConverter implements Converter<String, Product.FrameSize> {
        @Override public Product.FrameSize convert(String source) { return parseEnum(Product.FrameSize.class, source, null); }
    }
    @ReadingConverter
    public static class StringToProductGenderConverter implements Converter<String, Product.ProductGender> {
        @Override public Product.ProductGender convert(String source) { return parseEnum(Product.ProductGender.class, source, null); }
    }

    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
            new StringToProductTypeConverter(),
            new ProductTypeToStringConverter(),
            new StringToProductAvailabilityConverter(),
            new ProductAvailabilityToStringConverter(),
            new StringToOrderStatusConverter(),
            new OrderStatusToStringConverter(),
            new StringToPaymentStatusConverter(),
            new PaymentStatusToStringConverter(),
            new StringToPaymentMethodConverter(),
            new PaymentMethodToStringConverter(),
            new StringToCheckoutSessionStatusConverter(),
            new CheckoutSessionStatusToStringConverter(),
            new StringToFrameMaterialConverter(),
            new StringToFrameSizeConverter(),
            new StringToProductGenderConverter()
        ));
    }
}