package com.supermarket.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import com.supermarket.management.model.Product;
import com.supermarket.management.model.Offer;
import com.supermarket.management.model.Sale;
import com.supermarket.management.model.Notification;
import com.supermarket.management.model.CustomerProfile;

import java.net.URI;

@Configuration
@Profile("aws")
public class DynamoDbConfig {

    @Value("${aws.region:us-east-1}")
    private String region;

    @Value("${aws.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.secretAccessKey:}")
    private String secretAccessKey;

    @Value("${aws.dynamodb.endpoint:}")
    private String endpoint;

    @Bean
    public Region awsRegion() {
        return Region.of(region);
    }

    @Bean
    public DynamoDbClient dynamoDbClient(Region awsRegion) {
        var builder = DynamoDbClient.builder()
                .region(awsRegion);

        if (accessKeyId != null && !accessKeyId.trim().isEmpty() &&
            secretAccessKey != null && !secretAccessKey.trim().isEmpty()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim())
            ));
        }

        if (endpoint != null && !endpoint.trim().isEmpty()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }

    @Bean
    public CommandLineRunner initializeTables(DynamoDbEnhancedClient enhancedClient, DynamoDbClient dynamoDbClient) {
        return args -> {
            try {
                System.out.println("Initializing DynamoDB tables verification...");
                boolean tableCreated = false;
                tableCreated |= createTableIfNotExists(enhancedClient, "Products", Product.class);
                tableCreated |= createTableIfNotExists(enhancedClient, "Offers", Offer.class);
                tableCreated |= createTableIfNotExists(enhancedClient, "Sales", Sale.class);
                tableCreated |= createTableIfNotExists(enhancedClient, "Notifications", Notification.class);
                tableCreated |= createTableIfNotExists(enhancedClient, "Customers", CustomerProfile.class);

                if (tableCreated) {
                    System.out.println("Waiting for newly created tables to become ACTIVE...");
                    try (software.amazon.awssdk.services.dynamodb.waiters.DynamoDbWaiter waiter =
                         software.amazon.awssdk.services.dynamodb.waiters.DynamoDbWaiter.builder().client(dynamoDbClient).build()) {

                        waitForTableActive(waiter, "Products");
                        waitForTableActive(waiter, "Offers");
                        waitForTableActive(waiter, "Sales");
                        waitForTableActive(waiter, "Notifications");
                        waitForTableActive(waiter, "Customers");
                    }
                    System.out.println("All DynamoDB tables are now ACTIVE.");
                } else {
                    System.out.println("All DynamoDB tables verified to exist and are ACTIVE.");
                }
            } catch (Exception e) {
                System.err.println("CRITICAL: Error initializing DynamoDB tables: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    private <T> boolean createTableIfNotExists(DynamoDbEnhancedClient enhancedClient, String tableName, Class<T> clazz) {
        var table = enhancedClient.table(tableName, TableSchema.fromBean(clazz));
        try {
            table.describeTable();
            System.out.println("DynamoDB Table '" + tableName + "' already exists.");
            return false;
        } catch (ResourceNotFoundException e) {
            System.out.println("Creating DynamoDB Table '" + tableName + "'...");
            table.createTable();
            System.out.println("Table '" + tableName + "' creation request submitted.");
            return true;
        }
    }

    private void waitForTableActive(software.amazon.awssdk.services.dynamodb.waiters.DynamoDbWaiter waiter, String tableName) {
        System.out.println("Waiting for table '" + tableName + "' to become active...");
        waiter.waitUntilTableExists(r -> r.tableName(tableName));
        System.out.println("Table '" + tableName + "' is now active.");
    }

}

