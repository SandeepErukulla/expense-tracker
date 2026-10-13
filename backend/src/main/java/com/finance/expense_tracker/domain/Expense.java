package com.finance.expense_tracker.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "expenses")
@Getter
@Setter
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String title;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String category;

    @NotNull(message = "Expense date is required")
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}