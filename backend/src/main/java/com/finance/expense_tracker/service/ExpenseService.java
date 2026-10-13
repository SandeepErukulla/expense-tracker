package com.finance.expense_tracker.service;

import com.finance.expense_tracker.domain.Expense;
import com.finance.expense_tracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public Expense createExpense(Expense expense) {
        // Add any business validations here (e.g., check if amount > 0)
        return expenseRepository.save(expense);
    }

    public List<Expense> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    public List<Expense> getExpensesByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserIdAndExpenseDateBetween(userId, startDate, endDate);
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}