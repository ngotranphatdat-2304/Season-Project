package com.season.app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddress {
    
    // Mongoose tự sinh _id cho sub-doc, trong Java ta dùng ObjectId để tạo mã tương tự
    @Id
    @Builder.Default
    private String id = new ObjectId().toString();
    
    private String label;
    
    private String address;
    
    @Builder.Default
    private Boolean isDefault = false;
}
