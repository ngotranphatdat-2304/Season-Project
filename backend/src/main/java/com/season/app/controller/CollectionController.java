package com.season.app.controller;

import com.season.app.dto.product.CollectionFiltersResponseData;
import com.season.app.dto.product.ProductsResponseData;
import com.season.app.service.CollectionsService;
import com.season.app.service.ProductsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        ProductsResponseData data = productsService.getProductsByFilters(
                null, frameType, frameSize, slug, null, null, sort, offset, limit
        );
        return ResponseEntity.ok(data);
    }
}