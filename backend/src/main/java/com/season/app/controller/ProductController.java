package com.season.app.controller;

import com.season.app.dto.product.ProductResponse;
import com.season.app.dto.product.ProductSearchResponseData;
import com.season.app.dto.product.ProductsResponseData;
import com.season.app.service.ProductSearchService;
import com.season.app.service.ProductsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductsService productsService;
    private final ProductSearchService productSearchService;

    public ProductController(ProductsService productsService, ProductSearchService productSearchService) {
        this.productsService = productsService;
        this.productSearchService = productSearchService;
    }

    @GetMapping
    public ResponseEntity<ProductsResponseData> getProducts(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "frameType", required = false) String frameType,
            @RequestParam(value = "frameSize", required = false) String frameSize,
            @RequestParam(value = "collectionSlug", required = false) String collectionSlug,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "sale", required = false) Boolean sale,
            @RequestParam(value = "sort", defaultValue = "title-asc") String sort,
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "limit", defaultValue = "12") int limit
    ) {
        ProductsResponseData data = productsService.getProductsByFilters(
                type, frameType, frameSize, collectionSlug, gender, sale, sort, offset, limit
        );
        return ResponseEntity.ok(data);
    }

    @GetMapping("/search")
    public ResponseEntity<ProductSearchResponseData> searchProducts(
            @RequestParam("q") String q,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "sale", required = false) Boolean sale,
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "limit", defaultValue = "12") int limit
    ) {
        ProductSearchResponseData data = productSearchService.searchProducts(
                q, type, gender, sale, offset, limit
        );
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable("id") String id) {
        ProductResponse product = productsService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }
}