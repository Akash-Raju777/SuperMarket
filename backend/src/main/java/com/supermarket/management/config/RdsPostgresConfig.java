package com.supermarket.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.rds.RdsUtilities;
import software.amazon.awssdk.services.rds.model.GenerateAuthenticationTokenRequest;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Properties;

@Configuration
public class RdsPostgresConfig {

    @Value("${aws.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.secretAccessKey:}")
    private String secretAccessKey;

    @Bean
    public CommandLineRunner testRdsConnection() {
        return args -> {
            loadDotEnv();

            String rdsHost = System.getProperty("RDSHOST");
            String rdsPortStr = System.getProperty("RDS_PORT", "5432");
            String rdsDbName = System.getProperty("RDS_DBNAME", "postgres");
            String rdsUser = System.getProperty("RDS_USER", "postgres");
            String rdsRegion = System.getProperty("RDS_REGION", "ap-northeast-3");
            String sslMode = System.getProperty("RDS_SSLMODE", "verify-full");
            String sslRootCert = System.getProperty("RDS_SSLROOTCERT", "./global-bundle.pem");

            if (rdsHost == null || rdsHost.trim().isEmpty()) {
                System.out.println("AWS RDS host is not configured in .env file. Skipping connection test.");
                return;
            }

            int rdsPort = 5432;
            try {
                rdsPort = Integer.parseInt(rdsPortStr);
            } catch (NumberFormatException e) {
                // Ignore, use default 5432
            }

            System.out.println("----------------------------------------------------------------");
            System.out.println("AWS RDS PostgreSQL Connection Diagnostics");
            System.out.println("Host: " + rdsHost);
            System.out.println("Port: " + rdsPort);
            System.out.println("Database: " + rdsDbName);
            System.out.println("User: " + rdsUser);
            System.out.println("Region: " + rdsRegion);
            System.out.println("----------------------------------------------------------------");

            software.amazon.awssdk.auth.credentials.AwsCredentialsProvider credentialsProvider;
            if (accessKeyId != null && !accessKeyId.trim().isEmpty() &&
                secretAccessKey != null && !secretAccessKey.trim().isEmpty()) {
                credentialsProvider = software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.create(
                    software.amazon.awssdk.auth.credentials.AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim())
                );
                System.out.println("Using static AWS credentials from properties.");
            } else {
                credentialsProvider = software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider.create();
                System.out.println("Using standard AWS DefaultCredentialsProvider.");
            }

            String token = System.getProperty("RDS_PASSWORD");
            if (token != null && !token.trim().isEmpty()) {
                System.out.println("Using pre-configured AWS RDS IAM DB Auth Token from .env!");
            } else {
                try {
                    RdsUtilities rdsUtilities = RdsUtilities.builder()
                            .region(Region.of(rdsRegion))
                            .credentialsProvider(credentialsProvider)
                            .build();

                    GenerateAuthenticationTokenRequest tokenRequest = GenerateAuthenticationTokenRequest.builder()
                            .credentialsProvider(credentialsProvider)
                            .hostname(rdsHost)
                            .port(rdsPort)
                            .username(rdsUser)
                            .build();

                    token = rdsUtilities.generateAuthenticationToken(tokenRequest);
                    System.out.println("Successfully generated AWS RDS IAM DB Auth Token!");
                } catch (Exception e) {
                    System.err.println("Failed to generate AWS RDS IAM DB Auth Token: " + e.getMessage());
                    return;
                }
            }

            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", rdsHost, rdsPort, rdsDbName);
            
            Properties props = new Properties();
            props.setProperty("user", rdsUser);
            props.setProperty("password", token);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", sslMode);
            props.setProperty("sslrootcert", sslRootCert);

            System.out.println("Connecting to RDS PostgreSQL database via JDBC...");
            try (Connection conn = DriverManager.getConnection(jdbcUrl, props)) {
                System.out.println("SUCCESS: Successfully connected to AWS RDS PostgreSQL database!");
                
                System.out.println("Executing RDS 'db push' schema initialization...");
                try (Statement stmt = conn.createStatement()) {
                    
                    // Create products table and composite key
                    stmt.execute("CREATE TABLE IF NOT EXISTS products (" +
                            "id VARCHAR(100), " +
                            "name VARCHAR(255), " +
                            "brand VARCHAR(255), " +
                            "photoUrl VARCHAR(1024), " +
                            "mfgDate VARCHAR(50), " +
                            "expDate VARCHAR(50), " +
                            "arrivingDate VARCHAR(50), " +
                            "quantity INTEGER, " +
                            "price DOUBLE PRECISION)");
                    
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id VARCHAR(100)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS gst DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(255)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)");
                    stmt.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_status VARCHAR(50)");
                    
                    try {
                        stmt.execute("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey");
                        stmt.execute("ALTER TABLE products ADD PRIMARY KEY (id, business_id)");
                    } catch (Exception pkEx) {
                        System.out.println("Note on products primary key update: " + pkEx.getMessage());
                    }
                    System.out.println("-> Table 'products' verified/migrated.");

                    // Create offers table and composite key
                    stmt.execute("CREATE TABLE IF NOT EXISTS offers (" +
                            "offerId VARCHAR(100), " +
                            "productId VARCHAR(100), " +
                            "offerType VARCHAR(100), " +
                            "discount DOUBLE PRECISION, " +
                            "active BOOLEAN, " +
                            "startDate VARCHAR(50), " +
                            "endDate VARCHAR(50))");
                    stmt.execute("ALTER TABLE offers ADD COLUMN IF NOT EXISTS business_id VARCHAR(100)");
                    try {
                        stmt.execute("ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_pkey");
                        stmt.execute("ALTER TABLE offers ADD PRIMARY KEY (offerId, business_id)");
                    } catch (Exception pkEx) {
                        System.out.println("Note on offers primary key update: " + pkEx.getMessage());
                    }
                    System.out.println("-> Table 'offers' verified/migrated.");

                    // Create sales table and composite key
                    stmt.execute("CREATE TABLE IF NOT EXISTS sales (" +
                            "billId VARCHAR(100), " +
                            "productId VARCHAR(100), " +
                            "quantitySold INTEGER, " +
                            "saleDate VARCHAR(50), " +
                            "totalAmount DOUBLE PRECISION)");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS productName VARCHAR(255)");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS originalLineTotal DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS discountApplied DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS customerMobile VARCHAR(100)");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS customerName VARCHAR(255)");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS pointsEarned INTEGER");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS totalPoints INTEGER");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS finalAmount DOUBLE PRECISION");
                    stmt.execute("ALTER TABLE sales ADD COLUMN IF NOT EXISTS business_id VARCHAR(100)");
                    try {
                        stmt.execute("ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_pkey");
                        stmt.execute("ALTER TABLE sales ADD PRIMARY KEY (billId, productId, business_id)");
                    } catch (Exception pkEx) {
                        System.out.println("Note on sales primary key update: " + pkEx.getMessage());
                    }
                    System.out.println("-> Table 'sales' verified/migrated.");

                    // Create notifications table and composite key
                    stmt.execute("CREATE TABLE IF NOT EXISTS notifications (" +
                            "notificationId VARCHAR(100), " +
                            "type VARCHAR(100), " +
                            "message VARCHAR(1024), " +
                            "productId VARCHAR(100), " +
                            "timestamp VARCHAR(100), " +
                            "readStatus BOOLEAN)");
                    stmt.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS business_id VARCHAR(100)");
                    try {
                        stmt.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_pkey");
                        stmt.execute("ALTER TABLE notifications ADD PRIMARY KEY (notificationId, business_id)");
                    } catch (Exception pkEx) {
                        System.out.println("Note on notifications primary key update: " + pkEx.getMessage());
                    }
                    System.out.println("-> Table 'notifications' verified/migrated.");

                    // Create customer_profiles table and composite key
                    stmt.execute("CREATE TABLE IF NOT EXISTS customer_profiles (" +
                            "mobile VARCHAR(100), " +
                            "name VARCHAR(255), " +
                            "points INTEGER)");
                    stmt.execute("ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS business_id VARCHAR(100)");
                    try {
                        stmt.execute("ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS customer_profiles_pkey");
                        stmt.execute("ALTER TABLE customer_profiles ADD PRIMARY KEY (mobile, business_id)");
                    } catch (Exception pkEx) {
                        System.out.println("Note on customer_profiles primary key update: " + pkEx.getMessage());
                    }
                    System.out.println("-> Table 'customer_profiles' verified/migrated.");

                    // Create user_accounts table
                    stmt.execute("CREATE TABLE IF NOT EXISTS user_accounts (" +
                            "username VARCHAR(100) PRIMARY KEY, " +
                            "password VARCHAR(255), " +
                            "role VARCHAR(50))");
                    stmt.execute("ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)");
                    System.out.println("-> Table 'user_accounts' verified/migrated.");

                    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                    String pass123 = encoder.encode("password123");
                    String demoPass = encoder.encode("Demo@123");
                    String superPass = encoder.encode("demo123");

                    Object[][] users = new Object[][] {
                            {"admin", pass123, "Demo Business", "admin"},
                            {"cashier", pass123, "Demo Business", "cashier"},
                            {"demo@freshmart.com", demoPass, "Demo Business", "admin"},
                            {"demo@supermarket.com", superPass, "Demo Business", "admin"}
                    };

                    for (Object[] u : users) {
                        int count = 0;
                        try (PreparedStatement pStmt = conn.prepareStatement("SELECT COUNT(*) FROM user_accounts WHERE username = ?")) {
                            pStmt.setString(1, (String) u[0]);
                            try (ResultSet rs = pStmt.executeQuery()) {
                                if (rs.next()) {
                                    count = rs.getInt(1);
                                }
                            }
                        }
                        if (count == 0) {
                            try (PreparedStatement pStmt = conn.prepareStatement(
                                    "INSERT INTO user_accounts (username, password, business_name, role) VALUES (?, ?, ?, ?)")) {
                                pStmt.setString(1, (String) u[0]);
                                pStmt.setString(2, (String) u[1]);
                                pStmt.setString(3, (String) u[2]);
                                pStmt.setString(4, (String) u[3]);
                                pStmt.executeUpdate();
                            }
                            System.out.println("-> Seeded default user account: " + u[0]);
                        } else {
                            // Update password to ensure it is BCrypt encoded
                            try (PreparedStatement pStmt = conn.prepareStatement(
                                    "UPDATE user_accounts SET password = ?, business_name = ?, role = ? WHERE username = ?")) {
                                pStmt.setString(1, (String) u[1]);
                                pStmt.setString(2, (String) u[2]);
                                pStmt.setString(3, (String) u[3]);
                                pStmt.setString(4, (String) u[0]);
                                pStmt.executeUpdate();
                            }
                        }
                    }

                    // Populate Demo Data ONLY for 'Demo Business'
                    int prodCount = 0;
                    try (PreparedStatement pStmt = conn.prepareStatement("SELECT COUNT(*) FROM products WHERE business_id = ?")) {
                        pStmt.setString(1, "Demo Business");
                        try (ResultSet rs = pStmt.executeQuery()) {
                            if (rs.next()) {
                                prodCount = rs.getInt(1);
                            }
                        }
                    }
                    if (prodCount < 40) {
                        System.out.println("Seeding 50 realistic supermarket products for 'Demo Business'...");
                        
                        try (PreparedStatement deleteStmt = conn.prepareStatement("DELETE FROM products WHERE business_id = ?")) {
                            deleteStmt.setString(1, "Demo Business");
                            deleteStmt.executeUpdate();
                        }
                        
                        String insertSql = "INSERT INTO products (id, name, brand, photoUrl, mfgDate, expDate, arrivingDate, quantity, price, business_id, sku, barcode, category, cost_price, gst, supplier, batch_number, product_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        String today = java.time.LocalDate.now().toString();
                        String mfg = java.time.LocalDate.now().minusDays(10).toString();
                        String arrival = java.time.LocalDate.now().minusDays(5).toString();
                        String expNear = java.time.LocalDate.now().plusDays(10).toString();
                        String expFar = java.time.LocalDate.now().plusMonths(6).toString();
                        String expPassed = java.time.LocalDate.now().minusDays(2).toString();

                        Object[][] demoProducts = new Object[][] {
                            // 1. Dairy
                            {"P101", "Organic Whole Milk", "Lactaid", "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 45, 4.49, "SKU-MILK-101", "734567120192", "Dairy", 2.99, 5.0, "Lactaid Farms Inc.", "BATCH-MK-982", "IN_STOCK"},
                            {"P102", "Greek Yogurt Strawberry", "Chobani", "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 30, 1.89, "SKU-YOG-102", "734567120193", "Dairy", 1.10, 5.0, "Chobani LLC", "BATCH-YG-113", "IN_STOCK"},
                            {"P103", "Cheddar Cheese Block", "Cabot", "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 5.99, "SKU-CHS-103", "734567120194", "Dairy", 3.80, 5.0, "Cabot Cooperative", "BATCH-CH-441", "IN_STOCK"},
                            {"P104", "Unsalted Butter", "Kerrygold", "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 15, 3.99, "SKU-BUT-104", "734567120195", "Dairy", 2.50, 5.0, "Kerrygold Ireland", "BATCH-BT-209", "IN_STOCK"},
                            
                            // 2. Fruits
                            {"P105", "Red Apples 3lb Bag", "Washington", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 24, 4.99, "SKU-APP-105", "734567120196", "Fruits", 3.00, 0.0, "Washington Orchards", "BATCH-AP-552", "IN_STOCK"},
                            {"P106", "Bananas Bunch", "Dole", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 35, 1.99, "SKU-BAN-106", "734567120197", "Fruits", 1.00, 0.0, "Dole Produce", "BATCH-BN-102", "IN_STOCK"},
                            {"P107", "Strawberries Clamshell", "Driscoll's", "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 4, 3.99, "SKU-STR-107", "734567120198", "Fruits", 2.20, 0.0, "Driscoll Berries", "BATCH-ST-094", "LOW_STOCK"},
                            {"P108", "Blueberries Pint", "Driscoll's", "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 18, 4.49, "SKU-BLU-108", "734567120199", "Fruits", 2.60, 0.0, "Driscoll Berries", "BATCH-BB-871", "IN_STOCK"},
                            
                            // 3. Vegetables
                            {"P109", "Roma Tomatoes 1lb", "Greenhouse", "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 40, 2.49, "SKU-TOM-109", "734567120200", "Vegetables", 1.40, 0.0, "Greenhouse Agri", "BATCH-TM-432", "IN_STOCK"},
                            {"P110", "Iceberg Lettuce", "Fresh Farms", "https://images.unsplash.com/photo-1622484211148-716598e0e640?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 14, 1.89, "SKU-LET-110", "734567120201", "Vegetables", 0.90, 0.0, "Fresh Farms Ltd.", "BATCH-LT-712", "IN_STOCK"},
                            {"P111", "Fresh Carrots 2lb Bag", "Grimmway", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 25, 1.99, "SKU-CAR-111", "734567120202", "Vegetables", 1.10, 0.0, "Grimmway Farms", "BATCH-CR-119", "IN_STOCK"},
                            {"P112", "Yellow Onions 3lb", "Fresh Farms", "https://images.unsplash.com/photo-1508747702841-008cbda7779e?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 2.99, "SKU-ONN-112", "734567120203", "Vegetables", 1.60, 0.0, "Fresh Farms Ltd.", "BATCH-ON-603", "IN_STOCK"},
                            
                            // 4. Snacks
                            {"P113", "Potato Chips Classic", "Lay's", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 35, 3.99, "SKU-CHP-113", "734567120204", "Snacks", 2.20, 12.0, "PepsiCo Logistics", "BATCH-CP-089", "IN_STOCK"},
                            {"P114", "Chocolate Chip Cookies", "Chips Ahoy", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 28, 3.29, "SKU-CKI-114", "734567120205", "Snacks", 1.80, 12.0, "Mondelez Intl", "BATCH-CK-532", "IN_STOCK"},
                            {"P115", "Tortilla Chips", "Tostitos", "https://images.unsplash.com/photo-1518047601542-79f18c655718?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 30, 4.29, "SKU-TOR-115", "734567120206", "Snacks", 2.50, 12.0, "PepsiCo Logistics", "BATCH-TR-321", "IN_STOCK"},
                            {"P116", "Roasted Almonds", "Blue Diamond", "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 0, 6.99, "SKU-ALM-116", "734567120207", "Snacks", 4.00, 12.0, "Blue Diamond Growers", "BATCH-AL-124", "OUT_OF_STOCK"},
                            {"P117", "Microwave Popcorn", "Orville", "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 2.99, "SKU-POP-117", "734567120208", "Snacks", 1.50, 12.0, "Conagra Brands", "BATCH-PC-901", "IN_STOCK"},
                            
                            // 5. Beverages
                            {"P118", "Coca-Cola 12-Pack", "Coca-Cola", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 50, 7.99, "SKU-COK-118", "734567120209", "Beverages", 4.80, 18.0, "Coca-Cola Bottling", "BATCH-CC-012", "IN_STOCK"},
                            {"P119", "Orange Juice 100%", "Tropicana", "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 3, 4.99, "SKU-ORG-119", "734567120210", "Beverages", 3.10, 18.0, "PepsiCo Logistics", "BATCH-OJ-879", "LOW_STOCK"},
                            {"P120", "Ground Coffee Roast", "Starbucks", "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 25, 9.99, "SKU-COF-120", "734567120211", "Beverages", 6.20, 18.0, "Starbucks Corp", "BATCH-CF-303", "IN_STOCK"},
                            {"P121", "Green Tea Bags", "Lipton", "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 40, 3.49, "SKU-TEA-121", "734567120212", "Beverages", 1.90, 18.0, "Unilever Logistics", "BATCH-GT-604", "IN_STOCK"},
                            
                            // 6. Bakery
                            {"P122", "Whole Wheat Bread", "Nature's Own", "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 5, 3.29, "SKU-BRD-122", "734567120213", "Bakery", 1.90, 0.0, "Flowers Foods", "BATCH-BR-990", "LOW_STOCK"},
                            {"P123", "Butter Croissants", "Local Bakery", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 12, 4.49, "SKU-CRO-123", "734567120214", "Bakery", 2.50, 0.0, "Fresh Bake Dist", "BATCH-CR-002", "IN_STOCK"},
                            {"P124", "Blueberry Muffins", "Local Bakery", "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 10, 3.99, "SKU-MUF-124", "734567120215", "Bakery", 2.20, 0.0, "Fresh Bake Dist", "BATCH-MF-332", "IN_STOCK"},
                            {"P125", "Bagels Plain 6-Pack", "Thomas", "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=300", mfg, expNear, arrival, 8, 3.49, "SKU-BGL-125", "734567120216", "Bakery", 2.00, 0.0, "Bimbo Bakeries", "BATCH-BG-411", "IN_STOCK"},
                            
                            // 7. Frozen Foods
                            {"P126", "Frozen Cheese Pizza", "DiGiorno", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 16, 6.99, "SKU-PIZ-126", "734567120217", "Frozen Foods", 4.20, 18.0, "Nestle Frozen", "BATCH-PZ-991", "IN_STOCK"},
                            {"P127", "Vanilla Ice Cream Pint", "Haagen-Dazs", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 25, 5.49, "SKU-ICM-127", "734567120218", "Frozen Foods", 3.20, 18.0, "Nestle Frozen", "BATCH-IC-192", "IN_STOCK"},
                            {"P128", "Frozen Mixed Vegetables", "Birds Eye", "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 35, 2.49, "SKU-VEG-128", "734567120219", "Frozen Foods", 1.30, 18.0, "Conagra Brands", "BATCH-VG-228", "IN_STOCK"},
                            {"P129", "Chicken Nuggets Frozen", "Tyson", "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 18, 7.99, "SKU-NUG-129", "734567120220", "Frozen Foods", 4.90, 18.0, "Tyson Foods", "BATCH-NG-880", "IN_STOCK"},
                            
                            // 8. Household
                            {"P130", "Dish Soap 24oz", "Dawn", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 30, 3.49, "SKU-DSH-130", "734567120221", "Household", 2.10, 18.0, "Procter & Gamble", "BATCH-DS-320", "IN_STOCK"},
                            {"P131", "Laundry Detergent Pods", "Tide", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 15, 14.99, "SKU-LDR-131", "734567120222", "Household", 9.50, 18.0, "Procter & Gamble", "BATCH-TD-401", "IN_STOCK"},
                            {"P132", "All-Purpose Cleaner Spray", "Lysol", "https://images.unsplash.com/photo-1584820927498-cfe5211fd9bf?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 22, 4.29, "SKU-APC-132", "734567120223", "Household", 2.60, 18.0, "Reckitt Benckiser", "BATCH-LS-613", "IN_STOCK"},
                            {"P133", "Paper Towels 6-Rolls", "Bounty", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 8.99, "SKU-PPR-133", "734567120224", "Household", 5.40, 18.0, "Procter & Gamble", "BATCH-BY-505", "IN_STOCK"},
                            
                            // 9. Cleaning
                            {"P134", "Bleach Sanitizer", "Clorox", "https://images.unsplash.com/photo-1584820927498-cfe5211fd9bf?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 25, 4.89, "SKU-BLC-134", "734567120225", "Cleaning", 2.90, 18.0, "Clorox Company", "BATCH-CX-902", "IN_STOCK"},
                            {"P135", "Toilet Bowl Cleaner", "Lysol", "https://images.unsplash.com/photo-1584820927498-cfe5211fd9bf?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 18, 3.29, "SKU-TBC-135", "734567120226", "Cleaning", 1.80, 18.0, "Reckitt Benckiser", "BATCH-LY-099", "IN_STOCK"},
                            {"P136", "Floor Cleaner Liquid", "Pledge", "https://images.unsplash.com/photo-1584820927498-cfe5211fd9bf?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 12, 5.99, "SKU-FLR-136", "734567120227", "Cleaning", 3.70, 18.0, "S.C. Johnson", "BATCH-PL-871", "IN_STOCK"},
                            {"P137", "Garbage Bags 13G", "Glad", "https://images.unsplash.com/photo-1610312278520-dbc8935952d9?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 0, 9.99, "SKU-GBG-137", "734567120228", "Cleaning", 6.00, 18.0, "Clorox Company", "BATCH-GD-113", "OUT_OF_STOCK"},
                            
                            // 10. Personal Care
                            {"P138", "Shampoo Anti-Dandruff", "Head & Shoulders", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 30, 6.49, "SKU-SHM-138", "734567120229", "Personal Care", 3.80, 18.0, "Procter & Gamble", "BATCH-HS-902", "IN_STOCK"},
                            {"P139", "Toothpaste Whitening", "Colgate", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 45, 3.49, "SKU-TTH-139", "734567120230", "Personal Care", 1.90, 18.0, "Colgate-Palmolive", "BATCH-CG-419", "IN_STOCK"},
                            {"P140", "Hand Soap Liquid", "Softsoap", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 40, 2.19, "SKU-HND-140", "734567120231", "Personal Care", 1.20, 18.0, "Colgate-Palmolive", "BATCH-SS-081", "IN_STOCK"},
                            {"P141", "Body Wash Moisture", "Dove", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 5.89, "SKU-BDY-141", "734567120232", "Personal Care", 3.50, 18.0, "Unilever Logistics", "BATCH-DV-340", "IN_STOCK"},
                            
                            // 11. Baby Care
                            {"P142", "Baby Wipes 72ct", "Pampers", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 35, 3.29, "SKU-WIP-142", "734567120233", "Baby Care", 1.90, 18.0, "Procter & Gamble", "BATCH-PM-098", "IN_STOCK"},
                            {"P143", "Baby Powder Gentle", "Johnson's", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 18, 4.19, "SKU-PWD-143", "734567120234", "Baby Care", 2.40, 18.0, "Kenvue Inc.", "BATCH-JJ-821", "IN_STOCK"},
                            {"P144", "Baby Lotion Sensitive", "Johnson's", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 22, 4.99, "SKU-LTN-144", "734567120235", "Baby Care", 2.90, 18.0, "Kenvue Inc.", "BATCH-JJ-009", "IN_STOCK"},
                            {"P145", "Baby Formula Premium", "Enfamil", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 12, 28.99, "SKU-FML-145", "734567120236", "Baby Care", 19.50, 18.0, "Mead Johnson", "BATCH-EF-114", "IN_STOCK"},
                            
                            // 12. Pet Food
                            {"P146", "Dog Food Kibble 15lb", "Purina One", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 15, 24.99, "SKU-DOG-146", "734567120237", "Pet Food", 16.00, 18.0, "Nestle Purina", "BATCH-PR-998", "IN_STOCK"},
                            {"P147", "Cat Food Canned 24-Pack", "Friskies", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 20, 18.49, "SKU-CAT-147", "734567120238", "Pet Food", 12.00, 18.0, "Nestle Purina", "BATCH-FK-301", "IN_STOCK"},
                            {"P148", "Dog Treats Bacon Flavor", "Beggin Strips", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 25, 5.29, "SKU-TRT-148", "734567120239", "Pet Food", 3.10, 18.0, "Nestle Purina", "BATCH-BG-002", "IN_STOCK"},
                            {"P149", "Wild Bird Seed 10lb", "Kaytee", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 14, 11.99, "SKU-BRD-149", "734567120240", "Pet Food", 7.50, 18.0, "Kaytee Products", "BATCH-KT-614", "IN_STOCK"},
                            {"P150", "Clumping Cat Litter 20lb", "Tidy Cats", "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300", mfg, expFar, arrival, 10, 12.49, "SKU-LTR-150", "734567120241", "Pet Food", 8.00, 18.0, "Nestle Purina", "BATCH-TC-711", "IN_STOCK"}
                        };

                        for (Object[] p : demoProducts) {
                            try (PreparedStatement pInsert = conn.prepareStatement(insertSql)) {
                                pInsert.setString(1, (String) p[0]);
                                pInsert.setString(2, (String) p[1]);
                                pInsert.setString(3, (String) p[2]);
                                pInsert.setString(4, (String) p[3]);
                                pInsert.setString(5, (String) p[4]);
                                pInsert.setString(6, (String) p[5]);
                                pInsert.setString(7, (String) p[6]);
                                pInsert.setInt(8, (Integer) p[7]);
                                pInsert.setDouble(9, (Double) p[8]);
                                pInsert.setString(10, "Demo Business");
                                pInsert.setString(11, (String) p[9]);
                                pInsert.setString(12, (String) p[10]);
                                pInsert.setString(13, (String) p[11]);
                                pInsert.setDouble(14, (Double) p[12]);
                                pInsert.setDouble(15, (Double) p[13]);
                                pInsert.setString(16, (String) p[14]);
                                pInsert.setString(17, (String) p[15]);
                                pInsert.setString(18, (String) p[16]);
                                pInsert.addBatch();
                                pInsert.executeBatch();
                            }
                        }
                        System.out.println("-> Seeded 50 demo products successfully.");
                        
                        // Seed profiles
                        try (PreparedStatement seedStmt = conn.prepareStatement("DELETE FROM customer_profiles WHERE business_id = 'Demo Business'")) {
                            seedStmt.executeUpdate();
                        }
                        try (PreparedStatement cpInsert = conn.prepareStatement("INSERT INTO customer_profiles (mobile, name, points, business_id) VALUES (?, ?, ?, ?)")) {
                            Object[][] customers = new Object[][] {
                                {"1234567890", "John Doe", 150},
                                {"9876543210", "Jane Smith", 320},
                                {"5556667777", "Bob Johnson", 45}
                            };
                            for (Object[] c : customers) {
                                cpInsert.setString(1, (String) c[0]);
                                cpInsert.setString(2, (String) c[1]);
                                cpInsert.setInt(3, (Integer) c[2]);
                                cpInsert.setString(4, "Demo Business");
                                cpInsert.addBatch();
                            }
                            cpInsert.executeBatch();
                            System.out.println("-> Seeded 3 demo customer profiles successfully.");
                        }

                        // Seed offers
                        try (PreparedStatement seedStmt = conn.prepareStatement("DELETE FROM offers WHERE business_id = 'Demo Business'")) {
                            seedStmt.executeUpdate();
                        }
                        try (PreparedStatement offerInsert = conn.prepareStatement("INSERT INTO offers (offerId, productId, offerType, discount, active, startDate, endDate, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")) {
                            Object[][] offersList = new Object[][] {
                                {"O1_" + Math.abs("Demo Business".hashCode()), "P101", "BOGO", 0.0, true, today, expNear},
                                {"O2_" + Math.abs("Demo Business".hashCode()), "P126", "PERCENTAGE", 20.0, true, today, expNear},
                                {"O3_" + Math.abs("Demo Business".hashCode()), "P114", "B2G1", 0.0, true, today, expNear}
                            };
                            for (Object[] o : offersList) {
                                offerInsert.setString(1, (String) o[0]);
                                offerInsert.setString(2, (String) o[1]);
                                offerInsert.setString(3, (String) o[2]);
                                offerInsert.setDouble(4, (Double) o[3]);
                                offerInsert.setBoolean(5, (Boolean) o[4]);
                                offerInsert.setString(6, (String) o[5]);
                                offerInsert.setString(7, (String) o[6]);
                                offerInsert.setString(8, "Demo Business");
                                offerInsert.addBatch();
                            }
                            offerInsert.executeBatch();
                            System.out.println("-> Seeded 3 demo offers successfully.");
                        }

                        // Seed sales
                        try (PreparedStatement seedStmt = conn.prepareStatement("DELETE FROM sales WHERE business_id = 'Demo Business'")) {
                            seedStmt.executeUpdate();
                        }
                        try (PreparedStatement salesInsert = conn.prepareStatement("INSERT INTO sales (billId, productId, quantitySold, saleDate, totalAmount, productName, price, originalLineTotal, discountApplied, customerMobile, customerName, pointsEarned, totalPoints, subtotal, discount, tax, finalAmount, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                            for (int i = 1; i <= 20; i++) {
                                String billId = "B" + (System.currentTimeMillis() - i * 3600 * 1000);
                                String pId = "P1" + (10 + (i % 10));
                                String pName = "Product " + pId;
                                double price = 4.99;
                                int qty = 1 + (i % 3);
                                double sub = price * qty;
                                String date = java.time.LocalDate.now().minusDays(i % 6).toString();
                                
                                salesInsert.setString(1, billId);
                                salesInsert.setString(2, pId);
                                salesInsert.setInt(3, qty);
                                salesInsert.setString(4, date);
                                salesInsert.setDouble(5, sub);
                                salesInsert.setString(6, pName);
                                salesInsert.setDouble(7, price);
                                salesInsert.setDouble(8, sub);
                                salesInsert.setDouble(9, 0.0);
                                salesInsert.setString(10, "1234567890");
                                salesInsert.setString(11, "John Doe");
                                salesInsert.setInt(12, (int)sub);
                                salesInsert.setInt(13, 100);
                                salesInsert.setDouble(14, sub);
                                salesInsert.setDouble(15, 0.0);
                                salesInsert.setDouble(16, sub * 0.05);
                                salesInsert.setDouble(17, sub * 1.05);
                                salesInsert.setString(18, "Demo Business");
                                salesInsert.addBatch();
                            }
                            salesInsert.executeBatch();
                            System.out.println("-> Seeded 20 historical demo sales successfully.");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("DB PUSH ERROR: Failed to create tables in PostgreSQL: " + e.getMessage());
                    e.printStackTrace();
                }
            } catch (Exception e) {
                System.err.println("CONNECTION ERROR: Failed to connect to AWS RDS PostgreSQL database.");
                System.err.println("Details: " + e.getMessage());
            }
            System.out.println("----------------------------------------------------------------");
        };
    }

    private void loadDotEnv() {
        try {
            File file = new File(".env");
            if (!file.exists()) {
                file = new File("backend/.env");
            }
            if (file.exists()) {
                java.nio.file.Files.lines(file.toPath()).forEach(line -> {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                        int index = line.indexOf("=");
                        String key = line.substring(0, index).trim();
                        String value = line.substring(index + 1).trim();
                        System.setProperty(key, value);
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Could not load .env file: " + e.getMessage());
        }
    }
}
