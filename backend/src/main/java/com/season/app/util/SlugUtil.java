package com.season.app.util;

public final class SlugUtil {
    private SlugUtil() {
    }

    public static String normalizeSlug(String value) {
        if (value == null) {
            return "";
        }

        return value.trim()
                .toLowerCase()
                .replaceAll("[\\s_]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}

