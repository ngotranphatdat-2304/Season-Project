package com.season.app.service;

import com.season.app.dto.product.CollectionFilterResponse;
import com.season.app.dto.product.CollectionFiltersResponseData;
import com.season.app.model.Collection;
import com.season.app.repository.CollectionRepository;
import com.season.app.util.SlugUtil;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CollectionsService {
    private final CollectionRepository collectionRepository;

    public CollectionsService(CollectionRepository collectionRepository) {
        this.collectionRepository = collectionRepository;
    }

    public CollectionFiltersResponseData getCollectionFilters() {
        List<CollectionFilterResponse> records = collectionRepository.findAll().stream()
                .filter(collection -> collection.getInStockCount() != null && collection.getInStockCount() > 0)
                .sorted(Comparator.comparing(Collection::getName))
                .map(this::toCollectionFilterResponse)
                .collect(Collectors.toList());

        CollectionFiltersResponseData response = new CollectionFiltersResponseData();
        response.setRecords(records);
        return response;
    }

    public String normalizeCollectionSlug(String value) {
        return SlugUtil.normalizeSlug(value);
    }

    private CollectionFilterResponse toCollectionFilterResponse(Collection collection) {
        CollectionFilterResponse response = new CollectionFilterResponse();
        response.setId(collection.getId());
        response.setName(collection.getName());
        response.setSlug(collection.getSlug());
        response.setInStockCount(collection.getInStockCount());
        return response;
    }
}

