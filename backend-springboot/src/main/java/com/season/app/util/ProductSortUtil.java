package com.season.app.util;

import org.springframework.data.domain.Sort;

public final class ProductSortUtil {
    private ProductSortUtil() {
    }

    public static Sort buildProductSort(String sort) {
        if ("title-desc".equals(sort)) {
            return Sort.by(Sort.Order.desc("name"), Sort.Order.asc("slug"));
        }

        if ("price-desc".equals(sort)) {
            return Sort.by(Sort.Order.desc("variants.0.price"), Sort.Order.asc("slug"));
        }

        if ("price-asc".equals(sort)) {
            return Sort.by(Sort.Order.asc("variants.0.price"), Sort.Order.asc("slug"));
        }

        return Sort.by(Sort.Order.asc("name"), Sort.Order.asc("slug"));
    }
}

