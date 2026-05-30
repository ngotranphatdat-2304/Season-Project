package com.season.app.controller;

import com.season.app.dto.product.CollectionFiltersResponseData;
import com.season.app.dto.product.ProductsResponseData;
import com.season.app.service.CollectionsService;
import com.season.app.service.ProductsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j; //debug

@Slf4j //debug
@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionsService collectionsService;
    private final ProductsService productsService;

    public CollectionController(CollectionsService collectionsService, ProductsService productsService) {
        this.collectionsService = collectionsService;
        this.productsService = productsService;
    }

    @GetMapping
    public ResponseEntity<CollectionFiltersResponseData> getCollectionFilters() {
        return ResponseEntity.ok(collectionsService.getCollectionFilters());
    }

    @GetMapping("/{slug}/products")
    public ResponseEntity<ProductsResponseData> getCollectionProducts(
            @PathVariable("slug") String slug,
            @RequestParam(value = "frameType", required = false) String frameType,
            @RequestParam(value = "frameSize", required = false) String frameSize,
            @RequestParam(value = "sort", defaultValue = "title-asc") String sort,
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "limit", defaultValue = "12") int limit
    ) {
        log.info("============== BƯỚC 1: VÀO COLLECTION CONTROLLER =============="); //debug
        log.info("1. Controller nhận được request. Slug từ URL: [{}]", slug);
        log.info("2. Chuẩn bị gọi Service, tham số type (đầu tiên) đang bị set cứng là: [null]");

        ProductsResponseData data = productsService.getProductsByFilters(
                null, frameType, frameSize, slug, null, null, sort, offset, limit
        );
        log.info("============== KẾT THÚC API COLLECTION ==============\n"); //debug
        return ResponseEntity.ok(data);
    }
}