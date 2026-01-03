/**
 * Payroll Calculator Utility
 * Implements the formula-driven salary computation as per MACHINE_INSTRUCTION.md
 */

const STANDARD_ALLOWANCE = 4167.00;  // Fixed ₹4,167
const PROFESSIONAL_TAX = 200.00;      // Fixed ₹200

/**
 * Calculate complete salary structure from month wage
 * 
 * @param {number} monthWage - Monthly CTC/Wage
 * @returns {object} Complete salary breakdown
 */
function calculateSalaryStructure(monthWage) {
  const yearlyWage = monthWage * 12;
  
  // Basic Salary = 50% of Month Wage
  const basicSalary = monthWage * 0.50;
  
  // HRA = 50% of Basic Salary
  const hra = basicSalary * 0.50;
  
  // Performance Bonus = 8.33% of Basic Salary
  const performanceBonus = basicSalary * 0.0833;
  
  // LTA = 8.33% of Basic Salary
  const lta = basicSalary * 0.0833;
  
  // PF Deduction = 12% of Basic Salary
  const pfDeduction = basicSalary * 0.12;
  
  // Fixed Allowance = Month Wage - (Basic + HRA + Standard Allow + Bonus + LTA)
  const fixedAllowance = monthWage - (basicSalary + hra + STANDARD_ALLOWANCE + performanceBonus + lta);
  
  // Gross Salary (all earnings)
  const grossSalary = basicSalary + hra + STANDARD_ALLOWANCE + performanceBonus + lta + fixedAllowance;
  
  // Total Deductions
  const totalDeductions = pfDeduction + PROFESSIONAL_TAX;
  
  // Net Salary
  const netSalary = grossSalary - totalDeductions;
  
  return {
    monthWage: round(monthWage),
    yearlyWage: round(yearlyWage),
    
    // Earnings
    basicSalary: round(basicSalary),
    hra: round(hra),
    standardAllowance: round(STANDARD_ALLOWANCE),
    performanceBonus: round(performanceBonus),
    lta: round(lta),
    fixedAllowance: round(fixedAllowance),
    grossSalary: round(grossSalary),
    
    // Deductions
    pfDeduction: round(pfDeduction),
    professionalTax: round(PROFESSIONAL_TAX),
    totalDeductions: round(totalDeductions),
    
    // Net
    netSalary: round(netSalary),
  };
}

/**
 * Calculate salary for specific payable days
 * 
 * @param {object} salaryStructure - Full salary structure
 * @param {number} totalDays - Total working days in month
 * @param {number} payableDays - Days to be paid for
 * @returns {object} Prorated salary breakdown
 */
function calculateProratedSalary(salaryStructure, totalDays, payableDays) {
  const ratio = payableDays / totalDays;
  
  return {
    ...salaryStructure,
    payableDays,
    totalDays,
    
    // Prorated amounts
    proratedBasic: round(salaryStructure.basicSalary * ratio),
    proratedHra: round(salaryStructure.hra * ratio),
    proratedStandardAllowance: round(salaryStructure.standardAllowance * ratio),
    proratedPerformanceBonus: round(salaryStructure.performanceBonus * ratio),
    proratedLta: round(salaryStructure.lta * ratio),
    proratedFixedAllowance: round(salaryStructure.fixedAllowance * ratio),
    proratedGross: round(salaryStructure.grossSalary * ratio),
    proratedPf: round(salaryStructure.pfDeduction * ratio),
    proratedProfTax: round(PROFESSIONAL_TAX), // Professional tax is usually not prorated
    proratedNet: round((salaryStructure.grossSalary * ratio) - (salaryStructure.pfDeduction * ratio) - PROFESSIONAL_TAX),
  };
}

/**
 * Round to 2 decimal places
 */
function round(num) {
  return Math.round(num * 100) / 100;
}

module.exports = {
  calculateSalaryStructure,
  calculateProratedSalary,
  STANDARD_ALLOWANCE,
  PROFESSIONAL_TAX,
};
