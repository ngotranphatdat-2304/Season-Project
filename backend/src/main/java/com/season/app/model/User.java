package com.season.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users") // Chỉ định tên collection trong MongoDB
public class User {

    @Id
    private String id;

    // Tương đương: unique: true, lowercase: true trong Mongoose
    // Việc lowercase sẽ được xử lý ở tầng Service hoặc DTO trước khi lưu
    @Indexed(unique = true)
    private String email;

    // Tương đương: select: false. 
    // @JsonIgnore đảm bảo khi trả object User về Frontend, password sẽ bị ẩn đi.
    @JsonIgnore 
    private String password;

    @Builder.Default
    private String role = "customer"; // "admin" | "customer"

    private String name;

    private String phone;

    private String avatar;

    @Builder.Default
    private List<UserAddress> addresses = new ArrayList<>();

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String status = "active"; // "active" | "banned"

    // Tương đương { timestamps: true } của Mongoose
    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
