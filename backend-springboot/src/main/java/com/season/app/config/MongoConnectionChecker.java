package com.season.app.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoException;
import com.mongodb.client.MongoClient;
import java.util.Objects;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class MongoConnectionChecker implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(MongoConnectionChecker.class);

    private final MongoClient mongoClient;
    private final String mongoUri;
    private final String mongoDb;

    public MongoConnectionChecker(
            MongoClient mongoClient,
            @Value("${spring.mongodb.uri:}") String mongoUri,
            @Value("${spring.mongodb.database:}") String mongoDb
    ) {
        this.mongoClient = mongoClient;
        this.mongoUri = mongoUri;
        this.mongoDb = mongoDb;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (mongoUri == null || mongoUri.trim().isEmpty()) {
            throw new IllegalStateException("Please provide a MongoDB URI (MONGO_URI)");
        }

        final String resolvedDb = (mongoDb != null && mongoDb.trim().isEmpty() == false)
                ? mongoDb.trim()
                : Objects.requireNonNullElseGet(new ConnectionString(mongoUri).getDatabase(), () -> "admin");

        try {
            mongoClient
                    .getDatabase(resolvedDb)
                    .runCommand(new Document("ping", 1));

            final ConnectionString cs = new ConnectionString(mongoUri);
            final String hostInfo = cs.getHosts() != null && cs.getHosts().isEmpty() == false
                    ? String.join(",", cs.getHosts())
                    : mongoUri;

            logger.info("MongoDB connected {}", hostInfo);
        } catch (MongoException ex) {
            logger.error("MongoDB connection error:", ex);
            throw new IllegalStateException("MongoDB connection failed", ex);
        }
    }
}

