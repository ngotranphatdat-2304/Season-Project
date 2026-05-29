package com.season.app.dto;

import lombok.Data;

@Data
public class UserProfileUpdateInput {
    // Các trường này đều là optional (có thể null)
    private String name;
    private String phone;
    private String avatar;
    
    // Lưu ý: Logic "Phải truyền ít nhất 1 trường" (như trong TS cũ) 
    // thường được kiểm tra bằng code thủ công trong Controller hoặc Service ở Java
    public boolean hasAtLeastOneField() {
        return name != null || phone != null || avatar != null;
    }
}