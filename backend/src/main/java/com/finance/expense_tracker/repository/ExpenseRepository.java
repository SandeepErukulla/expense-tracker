package com.finance.expense_tracker.repository;

import com.finance.expense_tracker.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserId(Long userId);
    List<Expense> findByUserIdAndExpenseDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<Expense> findByUserIdAndCategory(Long userId, String category);
}