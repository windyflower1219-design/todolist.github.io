/**
 * Budget Logic for Team Card Manager
 * 
 * Rules:
 * 1. Manager Budget: 100,000 KRW/month
 * 2. Member Budget: 30,000 KRW/month
 * 3. Rollover: Monthly balance rolls over within the same quarter.
 * 4. Reset: Budget resets every quarter (End of March, June, September, December).
 */

import { format, isSameQuarter, startOfMonth, addMonths, subMonths, isBefore, isAfter, endOfMonth, getQuarter, startOfQuarter } from 'date-fns';

export const BUDGETS = {
    MANAGER: 100000,
    MEMBER: 30000
};

const getMemberBudgetForMonth = (member, targetMonthStr) => {
    // budgets: [{ amount, effectiveDate ('yyyy-MM') }]
    if (!member.budgets || member.budgets.length === 0) {
        return member.role === 'MANAGER' ? 100000 : 30000;
    }
    const sortedBudgets = [...member.budgets].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    const activeBudget = sortedBudgets.find(b => b.effectiveDate <= targetMonthStr) || sortedBudgets[sortedBudgets.length - 1];
    return activeBudget ? activeBudget.amount : (member.role === 'MANAGER' ? 100000 : 30000);
};

export const calculateBudget = (members, expenses, targetDate = new Date()) => {
    const targetMonthStart = startOfMonth(targetDate);
    const targetMonthStr = format(targetDate, 'yyyy-MM');
    const targetQuarter = getQuarter(targetDate);
    const quarterStart = startOfQuarter(targetDate);

    // Helper to calculate total base budget for a specific month
    const getMonthlyBaseTotal = (monthStr) => {
        return members.reduce((sum, m) => sum + getMemberBudgetForMonth(m, monthStr), 0);
    };

    // 2. Calculate rollover from previous months in SAME quarter
    let rollover = 0;
    let currentCheck = quarterStart;

    while (isBefore(currentCheck, targetMonthStart)) {
        const monthStr = format(currentCheck, 'yyyy-MM');
        const monthlyTotalBudget = getMonthlyBaseTotal(monthStr);

        const monthExpenses = expenses.filter(exp => format(new Date(exp.date), 'yyyy-MM') === monthStr);
        const spentInMonth = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const availableInMonth = monthlyTotalBudget + rollover;
        rollover = availableInMonth - spentInMonth;

        currentCheck = addMonths(currentCheck, 1);
    }

    // 3. Target Month Stats
    const targetMonthExpenses = expenses.filter(exp => format(new Date(exp.date), 'yyyy-MM') === targetMonthStr);
    const targetMonthSpent = targetMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const monthlyBaseAtTarget = getMonthlyBaseTotal(targetMonthStr);
    const currentMonthAvailable = monthlyBaseAtTarget + rollover;

    // 4. Quarterly Stats
    const quarterExpenses = expenses.filter(exp => isSameQuarter(new Date(exp.date), targetDate));
    const totalSpentInQuarter = quarterExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
        monthlyBase: monthlyBaseAtTarget,
        rolloverFromPrevMonths: rollover,
        currentMonthAvailable,
        currentMonthSpent: targetMonthSpent,
        currentMonthRemaining: currentMonthAvailable - targetMonthSpent,
        totalSpentInQuarter,
        quarter: targetQuarter,
        monthLabel: targetMonthStr,
        currentMonthSpent: targetMonthSpent // for backward compatibility/clarity
    };
};
