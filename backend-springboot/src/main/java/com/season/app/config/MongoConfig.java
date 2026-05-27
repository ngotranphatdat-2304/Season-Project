package com.season.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing // Bắt buộc phải có annotation này để @CreatedDate hoạt động
public class MongoConfig {
    // Không cần viết thêm logic gì ở đây, chỉ cần dùng annotation
}