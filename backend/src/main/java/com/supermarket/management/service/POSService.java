package com.supermarket.management.service;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.dto.CheckoutRequest;
import com.supermarket.management.dto.CheckoutResponse;
import com.supermarket.management.dto.CustomerResponse;
import com.supermarket.management.model.Offer;
import com.supermarket.management.model.Product;
import com.supermarket.management.model.Sale;
import com.supermarket.management.model.CustomerProfile;
import com.supermarket.management.repository.OfferRepository;
import com.supermarket.management.repository.ProductRepository;
import com.supermarket.management.repository.SaleRepository;
import com.supermarket.management.repository.CustomerProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class POSService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final OfferRepository offerRepository;
    private final NotificationService notificationService;
    private final CustomerProfileRepository customerProfileRepository;

    public POSService(ProductRepository productRepository,
                      SaleRepository saleRepository,
                      OfferRepository offerRepository,
                      NotificationService notificationService,
                      CustomerProfileRepository customerProfileRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.offerRepository = offerRepository;
        this.notificationService = notificationService;
        this.customerProfileRepository = customerProfileRepository;
    }

    public CustomerResponse getCustomer(String query) {
        String cleanQuery = query.trim();
        if (cleanQuery.isEmpty()) {
            return new CustomerResponse("", "", 0, false);
        }

        // 1. Try to search by direct mobile partition key first (if query is purely digits)
        boolean isNumeric = cleanQuery.matches("\\d+");
        if (isNumeric) {
            Optional<CustomerProfile> profileOpt = customerProfileRepository.findByMobile(cleanQuery);
            if (profileOpt.isPresent()) {
                CustomerProfile profile = profileOpt.get();
                return new CustomerResponse(profile.getMobile(), profile.getName(), profile.getPoints(), true);
            }
        }

        // 2. Try to search by case-insensitive name match or partial contains match
        List<CustomerProfile> profiles = customerProfileRepository.findAll();

        // Exact name match
        Optional<CustomerProfile> exactNameMatch = profiles.stream()
                .filter(p -> p.getName() != null && p.getName().trim().equalsIgnoreCase(cleanQuery))
                .findFirst();
        if (exactNameMatch.isPresent()) {
            CustomerProfile profile = exactNameMatch.get();
            return new CustomerResponse(profile.getMobile(), profile.getName(), profile.getPoints(), true);
        }

        // Partial name match
        Optional<CustomerProfile> partialNameMatch = profiles.stream()
                .filter(p -> p.getName() != null && p.getName().toLowerCase().contains(cleanQuery.toLowerCase()))
                .findFirst();
        if (partialNameMatch.isPresent()) {
            CustomerProfile profile = partialNameMatch.get();
            return new CustomerResponse(profile.getMobile(), profile.getName(), profile.getPoints(), true);
        }

        if (isNumeric) {
            return new CustomerResponse(cleanQuery, "", 0, false);
        } else {
            return new CustomerResponse("", cleanQuery, 0, false);
        }
    }

    public CheckoutResponse processCheckout(CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Checkout cart cannot be empty.");
        }

        String billId = "B" + System.currentTimeMillis();
        String saleDate = LocalDate.now().toString();
        
        List<Sale.SaleBuilder> saleBuilders = new ArrayList<>();
        List<CheckoutResponse.InvoiceItem> invoiceItems = new ArrayList<>();
        double totalSubtotal = 0.0;
        double totalDiscount = 0.0;

        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + item.getProductId()));

            if (product.getQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product '" + product.getName() + "'. Available: " + product.getQuantity());
            }

            double originalLineTotal = product.getPrice() * item.getQuantity();
            double discountApplied = 0.0;

            if (item.getOfferId() != null && !item.getOfferId().trim().isEmpty()) {
                Optional<Offer> offerOpt = offerRepository.findById(item.getOfferId());
                if (offerOpt.isPresent()) {
                    Offer offer = offerOpt.get();
                    if (Boolean.TRUE.equals(offer.getActive())) {
                        switch (offer.getOfferType().toUpperCase()) {
                            case "BOGO":
                                int freeQty = item.getQuantity() / 2;
                                discountApplied = freeQty * product.getPrice();
                                break;
                            case "B2G1":
                                int freeQtyB2G1 = item.getQuantity() / 3;
                                discountApplied = freeQtyB2G1 * product.getPrice();
                                break;
                            case "PERCENTAGE":
                                discountApplied = originalLineTotal * (offer.getDiscount() / 100.0);
                                break;
                            case "FIXED":
                                discountApplied = offer.getDiscount() * item.getQuantity();
                                if (discountApplied > originalLineTotal) {
                                    discountApplied = originalLineTotal;
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }

            double finalLineTotal = originalLineTotal - discountApplied;

            // Update product stock
            product.setQuantity(product.getQuantity() - item.getQuantity());
            productRepository.save(product);
            
            // Trigger alerts (low stock / out of stock checks)
            notificationService.triggerStockCheck(product);

            // Prepare Sale Builder (to save after calculations finalize)
            Sale.SaleBuilder saleBuilder = Sale.builder()
                    .billId(billId)
                    .productId(product.getId())
                    .quantitySold(item.getQuantity())
                    .saleDate(saleDate)
                    .totalAmount(finalLineTotal)
                    .productName(product.getName())
                    .price(product.getPrice())
                    .originalLineTotal(originalLineTotal)
                    .discountApplied(discountApplied);
            saleBuilders.add(saleBuilder);

            // Add Invoice Item DTO
            invoiceItems.add(CheckoutResponse.InvoiceItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(item.getQuantity())
                    .price(product.getPrice())
                    .originalLineTotal(Math.round(originalLineTotal * 100.0) / 100.0)
                    .discountApplied(Math.round(discountApplied * 100.0) / 100.0)
                    .finalLineTotal(Math.round(finalLineTotal * 100.0) / 100.0)
                    .build());

            totalSubtotal += originalLineTotal;
            totalDiscount += discountApplied;
        }

        // Apply sales tax of 5% (on subtotal after discounts)
        // Wait, what if they redeem points? Let's check:
        boolean redeemed = false;
        int pointsEarned = 0;
        int pointsBefore = 0;
        int totalPointsAfter = 0;
        String finalCustomerName = "";

        CustomerProfile customer = null;
        if (request.getCustomerMobile() != null && !request.getCustomerMobile().trim().isEmpty()) {
            String mobile = request.getCustomerMobile().trim();
            String nameInput = request.getCustomerName();
            if (nameInput == null || nameInput.trim().isEmpty()) {
                nameInput = "Loyal Customer";
            }
            final String customerNameVal = nameInput.trim();

            Optional<CustomerProfile> customerOpt = customerProfileRepository.findByMobile(mobile);
            if (customerOpt.isPresent()) {
                customer = customerOpt.get();
                if (request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()) {
                    customer.setName(request.getCustomerName().trim());
                }
            } else {
                customer = new CustomerProfile(mobile, customerNameVal, 0);
            }

            finalCustomerName = customer.getName();
            pointsBefore = customer.getPoints();

            if (Boolean.TRUE.equals(request.getRedeemPoints()) && pointsBefore >= 50) {
                redeemed = true;
                customer.setPoints(pointsBefore - 50);
                double redemptionDiscount = totalSubtotal * 0.15;
                totalDiscount += redemptionDiscount;
            }
            customerProfileRepository.save(customer);
        }

        double taxableAmount = totalSubtotal - totalDiscount;
        if (taxableAmount < 0.0) {
            taxableAmount = 0.0;
        }
        double tax = taxableAmount * 0.05;
        double finalAmount = taxableAmount + tax;

        if (request.getCustomerMobile() != null && !request.getCustomerMobile().trim().isEmpty() && customer != null) {
            pointsEarned = (int) (finalAmount / 10.0);
            customer.setPoints(customer.getPoints() + pointsEarned);
            totalPointsAfter = customer.getPoints();
            customerProfileRepository.save(customer);
        }

        // Finalize and save all Sales with bill-level metadata
        for (Sale.SaleBuilder sb : saleBuilders) {
            Sale sale = sb
                    .customerMobile(request.getCustomerMobile())
                    .customerName(finalCustomerName)
                    .pointsEarned(pointsEarned)
                    .totalPoints(totalPointsAfter)
                    .subtotal(Math.round(totalSubtotal * 100.0) / 100.0)
                    .discount(Math.round(totalDiscount * 100.0) / 100.0)
                    .tax(Math.round(tax * 100.0) / 100.0)
                    .finalAmount(Math.round(finalAmount * 100.0) / 100.0)
                    .build();
            saleRepository.save(sale);
        }

        // Run expiry checks to make sure slow sales velocity alters state
        final String tenant = TenantContext.getCurrentTenant();
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                TenantContext.setCurrentTenant(tenant);
                notificationService.runExpiryAndSalesChecks();
            } finally {
                TenantContext.clear();
            }
        });

        return CheckoutResponse.builder()
                .billId(billId)
                .customerMobile(request.getCustomerMobile())
                .customerName(finalCustomerName)
                .pointsEarned(pointsEarned)
                .totalPoints(totalPointsAfter)
                .saleDate(saleDate)
                .items(invoiceItems)
                .subtotal(Math.round(totalSubtotal * 100.0) / 100.0)
                .discount(Math.round(totalDiscount * 100.0) / 100.0)
                .tax(Math.round(tax * 100.0) / 100.0)
                .finalAmount(Math.round(finalAmount * 100.0) / 100.0)
                .build();
    }



    public List<CheckoutResponse> getAllBills() {
        List<Sale> sales = saleRepository.findAll();
        
        // Group sales by billId
        Map<String, List<Sale>> groupedSales = sales.stream()
                .collect(Collectors.groupingBy(Sale::getBillId));
                
        List<CheckoutResponse> bills = new ArrayList<>();
        
        for (Map.Entry<String, List<Sale>> entry : groupedSales.entrySet()) {
            String billId = entry.getKey();
            List<Sale> billSales = entry.getValue();
            if (billSales.isEmpty()) continue;
            
            Sale firstSale = billSales.get(0);
            
            List<CheckoutResponse.InvoiceItem> items = billSales.stream()
                    .map(s -> CheckoutResponse.InvoiceItem.builder()
                            .productId(s.getProductId())
                            .productName(s.getProductName() != null ? s.getProductName() : "Product " + s.getProductId())
                            .quantity(s.getQuantitySold())
                            .price(s.getPrice() != null ? s.getPrice() : (s.getTotalAmount() / (s.getQuantitySold() > 0 ? s.getQuantitySold() : 1)))
                            .originalLineTotal(s.getOriginalLineTotal() != null ? s.getOriginalLineTotal() : s.getTotalAmount())
                            .discountApplied(s.getDiscountApplied() != null ? s.getDiscountApplied() : 0.0)
                            .finalLineTotal(s.getTotalAmount())
                            .build())
                    .collect(Collectors.toList());
                    
            bills.add(CheckoutResponse.builder()
                    .billId(billId)
                    .customerMobile(firstSale.getCustomerMobile())
                    .customerName(firstSale.getCustomerName())
                    .pointsEarned(firstSale.getPointsEarned() != null ? firstSale.getPointsEarned() : 0)
                    .totalPoints(firstSale.getTotalPoints() != null ? firstSale.getTotalPoints() : 0)
                    .saleDate(firstSale.getSaleDate())
                    .items(items)
                    .subtotal(firstSale.getSubtotal() != null ? firstSale.getSubtotal() : 0.0)
                    .discount(firstSale.getDiscount() != null ? firstSale.getDiscount() : 0.0)
                    .tax(firstSale.getTax() != null ? firstSale.getTax() : 0.0)
                    .finalAmount(firstSale.getFinalAmount() != null ? firstSale.getFinalAmount() : 0.0)
                    .build());
        }
        
        // Sort by bill ID descending (most recent first)
        bills.sort((b1, b2) -> b2.getBillId().compareTo(b1.getBillId()));
        
        return bills;
    }
}
