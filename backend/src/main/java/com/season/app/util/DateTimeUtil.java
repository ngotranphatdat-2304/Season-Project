package com.season.app.util;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class DateTimeUtil {
    private DateTimeUtil() {
    }

    public record DayLabel(String key, String label) {}

    public static List<DayLabel> getLastSevenDays() {
        List<DayLabel> days = new ArrayList<>();
        LocalDate now = LocalDate.now(ZoneId.systemDefault());

        for (int offset = 6; offset >= 0; offset -= 1) {
            LocalDate day = now.minusDays(offset);
            String key = day.toString();
            String weekday = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.US);
            String label = weekday + " " + String.format("%02d/%02d", day.getDayOfMonth(), day.getMonthValue());
            days.add(new DayLabel(key, label));
        }

        return days;
    }
}

