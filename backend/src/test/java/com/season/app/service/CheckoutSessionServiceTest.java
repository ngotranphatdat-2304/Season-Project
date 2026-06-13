package com.season.app.service;

import com.mongodb.bulk.BulkWriteResult;
import com.season.app.dto.checkout.CheckoutCompleteInput;
import com.season.app.model.CheckoutSession;
import com.season.app.model.Order;
import com.season.app.model.Product;
import com.season.app.repository.CartRepository;
import com.season.app.repository.CheckoutSessionRepository;
import com.season.app.repository.OrderRepository;
import com.season.app.repository.ProductRepository;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutSessionServiceTest {

    private static final String TOKEN = "checkout-token";
    private static final String OWNER_ID = "guest-1";

    @Mock
    private CartRepository cartRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CheckoutSessionRepository checkoutSessionRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private OrderEmailService orderEmailService;
    @Mock
    private BulkOperations stockBulkOps;
    @Mock
    private BulkOperations availabilityBulkOps;
    @Mock
    private BulkWriteResult stockResult;
    @Mock
    private BulkWriteResult availabilityResult;

    @InjectMocks
    private CheckoutSessionService checkoutSessionService;

    @Test
    void completeCheckoutSessionUsesOneStockBulkForMultipleItems() {
        CheckoutSession session = checkoutSession(List.of(
                item("product-1", "sku-1", 2),
                item("product-2", "sku-2", 1)
        ));
        stubSession(session);
        stubSuccessfulBulkStockDeduction(2, List.of(
                product("product-1", variant("sku-1", 0)),
                product("product-2", variant("sku-2", 3))
        ));
        stubSuccessfulOrderSave();

        checkoutSessionService.completeCheckoutSession(TOKEN, OWNER_ID, false, checkoutInput());

        verify(stockBulkOps, times(2)).updateOne(any(Query.class), any(Update.class));
        verify(stockBulkOps).execute();
        verify(availabilityBulkOps, times(2)).updateOne(any(Query.class), any(Update.class));
        verify(availabilityBulkOps).execute();
        verify(mongoTemplate, times(2)).bulkOps(BulkOperations.BulkMode.ORDERED, Product.class);
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Product.class));
    }

    @Test
    void completeCheckoutSessionThrowsConflictWhenBulkModifiedCountDoesNotMatchItems() {
        CheckoutSession session = checkoutSession(List.of(
                item("product-1", "sku-1", 2),
                item("product-2", "sku-2", 1)
        ));
        stubSession(session);
        when(mongoTemplate.bulkOps(BulkOperations.BulkMode.ORDERED, Product.class)).thenReturn(stockBulkOps);
        when(stockBulkOps.updateOne(any(Query.class), any(Update.class))).thenReturn(stockBulkOps);
        when(stockBulkOps.execute()).thenReturn(stockResult);
        when(stockResult.getModifiedCount()).thenReturn(1);

        CheckoutSessionService.CheckoutSessionServiceError error = assertThrows(
                CheckoutSessionService.CheckoutSessionServiceError.class,
                () -> checkoutSessionService.completeCheckoutSession(TOKEN, OWNER_ID, false, checkoutInput())
        );

        assertEquals(409, error.getStatusCode());
        verify(stockBulkOps, times(2)).updateOne(any(Query.class), any(Update.class));
        verify(orderRepository, never()).save(any(Order.class));
        verify(checkoutSessionRepository, never()).save(any(CheckoutSession.class));
        verify(mongoTemplate, never()).find(any(Query.class), eq(Product.class));
    }

    @Test
    void completeCheckoutSessionAggregatesDuplicateProductVariantSnapshots() {
        CheckoutSession session = checkoutSession(List.of(
                item("product-1", "sku-1", 1),
                item("product-1", "sku-1", 2)
        ));
        stubSession(session);
        stubSuccessfulBulkStockDeduction(1, List.of(product("product-1", variant("sku-1", 2))));
        stubSuccessfulOrderSave();

        checkoutSessionService.completeCheckoutSession(TOKEN, OWNER_ID, false, checkoutInput());

        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(stockBulkOps).updateOne(any(Query.class), updateCaptor.capture());
        Document inc = updateCaptor.getValue().getUpdateObject().get("$inc", Document.class);
        assertEquals(-3, inc.get("variants.$.stock"));
    }

    @Test
    void completeCheckoutSessionRecalculatesAvailabilityWithOneBulkWrite() {
        CheckoutSession session = checkoutSession(List.of(
                item("product-1", "sku-1", 2),
                item("product-2", "sku-2", 1)
        ));
        stubSession(session);
        stubSuccessfulBulkStockDeduction(2, List.of(
                product("product-1", variant("sku-1", 0), variant("sku-other", 0)),
                product("product-2", variant("sku-2", 4), variant("sku-other", null))
        ));
        stubSuccessfulOrderSave();

        checkoutSessionService.completeCheckoutSession(TOKEN, OWNER_ID, false, checkoutInput());

        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(availabilityBulkOps, times(2)).updateOne(any(Query.class), updateCaptor.capture());
        List<Update> updates = updateCaptor.getAllValues();
        assertEquals(
                Product.ProductAvailability.OUT_OF_STOCK,
                updates.get(0).getUpdateObject().get("$set", Document.class).get("availability")
        );
        assertEquals(
                Product.ProductAvailability.IN_STOCK,
                updates.get(1).getUpdateObject().get("$set", Document.class).get("availability")
        );
        verify(mongoTemplate).find(any(Query.class), eq(Product.class));
        verify(availabilityBulkOps).execute();
    }

    private void stubSession(CheckoutSession session) {
        when(checkoutSessionRepository.findByToken(TOKEN)).thenReturn(Optional.of(session));
    }

    private void stubSuccessfulBulkStockDeduction(int modifiedCount, List<Product> productsAfterDeduction) {
        when(mongoTemplate.bulkOps(BulkOperations.BulkMode.ORDERED, Product.class))
                .thenReturn(stockBulkOps, availabilityBulkOps);
        when(stockBulkOps.updateOne(any(Query.class), any(Update.class))).thenReturn(stockBulkOps);
        when(stockBulkOps.execute()).thenReturn(stockResult);
        when(stockResult.getModifiedCount()).thenReturn(modifiedCount);
        when(mongoTemplate.find(any(Query.class), eq(Product.class))).thenReturn(productsAfterDeduction);
        when(availabilityBulkOps.updateOne(any(Query.class), any(Update.class))).thenReturn(availabilityBulkOps);
        when(availabilityBulkOps.execute()).thenReturn(availabilityResult);
    }

    private void stubSuccessfulOrderSave() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId("order-1");
            return order;
        });
        when(checkoutSessionRepository.save(any(CheckoutSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private CheckoutCompleteInput checkoutInput() {
        CheckoutCompleteInput input = new CheckoutCompleteInput();
        input.setCustomerEmail("buyer@example.com");
        input.setPaymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY);
        input.setShippingAddress(Order.ShippingAddress.builder()
                .recipientName("Buyer")
                .phone("0900000000")
                .line1("123 Test Street")
                .city("Ho Chi Minh City")
                .country("Vietnam")
                .build());
        return input;
    }

    private CheckoutSession checkoutSession(List<CheckoutSession.ItemSnapshot> items) {
        return CheckoutSession.builder()
                .token(TOKEN)
                .guestId(OWNER_ID)
                .status(CheckoutSession.CheckoutSessionStatus.PENDING)
                .itemsSnapshot(items)
                .subtotalAmount(100.0)
                .shippingFee(0.0)
                .totalAmount(100.0)
                .currency("VND")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    private CheckoutSession.ItemSnapshot item(String productId, String variantSku, Integer quantity) {
        return CheckoutSession.ItemSnapshot.builder()
                .productId(productId)
                .productName("Product " + productId)
                .variantSku(variantSku)
                .variantColor("Black")
                .imageUrl("")
                .unitPrice(50.0)
                .quantity(quantity)
                .lineTotal(50.0 * quantity)
                .build();
    }

    private Product product(String productId, Product.Variant... variants) {
        return Product.builder()
                .id(productId)
                .availability(Product.ProductAvailability.IN_STOCK)
                .isActive(true)
                .variants(List.of(variants))
                .build();
    }

    private Product.Variant variant(String sku, Integer stock) {
        return Product.Variant.builder()
                .sku(sku)
                .color("Black")
                .price(50.0)
                .stock(stock)
                .build();
    }
}
