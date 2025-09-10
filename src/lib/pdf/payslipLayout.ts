import jsPDF from 'jspdf';

// A4 Paper dimensions in mm (ISO 216)
export const A4_DIMENSIONS = {
  width: 210,
  height: 297,
  margins: {
    top: 15,
    bottom: 15,
    left: 10,
    right: 10
  }
} as const;

// Verification logging for PDF page size
export const verifyPDFPageSize = (doc: jsPDF) => {
  const pageInfo = doc.internal.pageSize;
  const actualWidth = Math.round(pageInfo.getWidth());
  const actualHeight = Math.round(pageInfo.getHeight());
  
  console.log('=== PDF Page Size Verification ===');
  console.log(`Expected A4 Dimensions: ${A4_DIMENSIONS.width}mm × ${A4_DIMENSIONS.height}mm`);
  console.log(`Actual PDF Dimensions: ${actualWidth}mm × ${actualHeight}mm`);
  console.log(`Format Match: ${actualWidth === A4_DIMENSIONS.width && actualHeight === A4_DIMENSIONS.height ? 'VERIFIED ✅' : 'MISMATCH ❌'}`);
  console.log(`Page Unit: ${doc.internal.scaleFactor} units per mm`);
  console.log(`Document Properties:`, doc.internal);
  console.log('================================');
  
  return {
    isValid: actualWidth === A4_DIMENSIONS.width && actualHeight === A4_DIMENSIONS.height,
    actual: { width: actualWidth, height: actualHeight },
    expected: A4_DIMENSIONS
  };
};

export interface PayslipData {
  employee: {
    id: string;
    employee_id: string;
    name: string;
    position: string;
    join_date: string;
    basic_salary: number;
    hra: number;
    allowances: number;
    gross_salary?: number;
    pf_number?: string;
    esi_number?: string;
    per_day_salary?: number;
    day_rate?: number; // Added to mirror Excel calc path
    da_amount?: number;
    shoe_uniform_allowance?: number;
    other_allowances?: number;
  };
  branch: {
    name: string;
  };
  stats: {
    present_days: number;
    absent_days: number;
    late_days: number;
    ot_hours: number;
    food?: number;
    uniform?: number;
    rent_deduction?: number;
    advance?: number;
  };
  payroll?: {
    basic_plus_da: number;
    hra: number;
    allowances: number;
    ot_amount: number;
    gross_earnings: number;
    pf_12_percent: number;
    esi_0_75_percent: number;
    deductions: number;
    net_pay: number;
    worked_days: number;
    food?: number;
    uniform?: number;
    rent_deduction?: number;
    shoe_uniform_allowance?: number;
    advance?: number;
  };
  month: string;
}

export const drawPayslipSection = (
  doc: jsPDF,
  data: PayslipData,
  yPosition: number
): number => {
  const { employee, branch, stats, month, payroll } = data;
  
  // Debug: Log the data being passed to PDF generation
  console.log('=== PDF Generation Debug ===');
  console.log('Employee data:', employee);
  console.log('Branch data:', branch);
  console.log('Stats data:', stats);
  console.log('Month:', month);
  console.log('Payroll data:', payroll);
  console.log('===========================');
  
  // Verify PDF dimensions before drawing
  const verification = verifyPDFPageSize(doc);
  if (!verification.isValid) {
    console.warn('PDF dimensions do not match A4 standard!');
  }
  
  // Calculate financial values - use payroll data if available, otherwise calculate with robust fallback
  let basicPlusDA, hraAmount, allowancesAmount, otAmount, grossEarnings, pf, esi, totalDeductions, netPay;

  // Always compute fallback values first from employee + attendance
  const workedDays = (payroll?.worked_days ?? stats.present_days ?? 0);

  const perDaySalary = (employee.per_day_salary && employee.per_day_salary > 0)
    ? employee.per_day_salary
    : (employee.day_rate && employee.day_rate > 0)
      ? employee.day_rate
      : (employee.basic_salary || 0) / 30; // Fallback to basic_salary/30 if no per day rate

  // Fetch branch OT rate (default 60 if not available)
  const branchOTRate = 60;

  const basicRate = perDaySalary * 0.60;
  const daRate = perDaySalary * 0.40;

  const basicEarned = basicRate * workedDays;
  const daEarned = daRate * workedDays;

  const fb_basicPlusDA = basicEarned + daEarned;
  const fb_hraAmount = employee.hra || 0;
  const fb_allowancesAmount = (employee.allowances || 0) + (employee.shoe_uniform_allowance || 0);
  const fb_otAmount = Math.round((stats.ot_hours || 0) * branchOTRate);
  const fb_grossEarnings = fb_basicPlusDA + fb_hraAmount + fb_allowancesAmount + fb_otAmount;

  const pfBase = basicEarned + daEarned;
  const fb_pf = Math.min(Math.round(pfBase * 0.12), 1800);
  
  // ESI calculation - 0.75% of eligible earnings, only if employee is ESI eligible
  const isESIEligible = employee.esi_number && employee.esi_number.trim() !== '';
  const specialBranches = ['UP-TN', 'UP-BAG'];
  const esiBase = specialBranches.includes(branch.name) ? pfBase : pfBase + fb_otAmount;
  const fb_esi = isESIEligible ? Math.round(esiBase * 0.0075) : 0;

  const foodDeduction = (payroll?.food ?? stats.food ?? 0);
  const uniformDeduction = (payroll?.uniform ?? stats.uniform ?? 0);
  const rentDeduction = (payroll?.rent_deduction ?? stats.rent_deduction ?? 0);
  const advanceDeduction = (payroll?.advance ?? stats.advance ?? 0);
  const fb_totalDeductions = fb_pf + fb_esi + foodDeduction + uniformDeduction + rentDeduction + advanceDeduction;
  const fb_netPay = fb_grossEarnings - fb_totalDeductions;

  // Prefer payroll values when present and > 0, otherwise fallback
  basicPlusDA = (payroll?.basic_plus_da && payroll.basic_plus_da > 0) ? payroll.basic_plus_da : fb_basicPlusDA;
  hraAmount = (payroll?.hra && payroll.hra > 0) ? payroll.hra : fb_hraAmount;
  allowancesAmount = (payroll?.allowances && payroll.allowances > 0) ? payroll.allowances : fb_allowancesAmount;
  otAmount = (payroll?.ot_amount && payroll.ot_amount > 0) ? payroll.ot_amount : fb_otAmount;
  grossEarnings = (payroll?.gross_earnings && payroll.gross_earnings > 0) ? payroll.gross_earnings : fb_grossEarnings;
  pf = (payroll?.pf_12_percent && payroll.pf_12_percent > 0) ? payroll.pf_12_percent : fb_pf;
  esi = (payroll?.esi_0_75_percent && payroll.esi_0_75_percent > 0) ? payroll.esi_0_75_percent : fb_esi;
  totalDeductions = (payroll?.deductions && payroll.deductions > 0) ? payroll.deductions : fb_totalDeductions;
  netPay = (payroll?.net_pay && payroll.net_pay > 0) ? payroll.net_pay : fb_netPay;

  console.log('PDF calc (resolved values):', {
    workedDays,
    perDaySalary,
    basicRate,
    daRate,
    basicEarned,
    daEarned,
    basicPlusDA,
    otAmount,
    grossEarnings,
    pf,
    esi,
    foodDeduction,
    uniformDeduction,
    totalDeductions,
    netPay,
    branch: branch.name
  });
  
  const startX = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);
  
  // Calculate section height to fit 3 sections with gaps
  const sectionGap = 2;
  const sectionHeight = (availableHeight - (2 * sectionGap)) / 3; // ~56mm per section
  
  let yPos = yPosition;
  
  // Draw main border
  doc.setLineWidth(1.0);
  doc.rect(startX, yPos, availableWidth, sectionHeight);
  
  // Scale factors for content
  const contentPadding = 6;
  const headerHeight = sectionHeight * 0.16; // 16% for header
  const infoHeight = sectionHeight * 0.24; // 24% for employee info
  const tableHeight = sectionHeight - headerHeight - infoHeight - 18;
  
  // Header section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('SSS SOLUTIONS', startX + availableWidth/2, yPos + 8, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('PAYSLIP', startX + availableWidth/2, yPos + 12, { align: 'center' });
  
  // Branch name positioned at top right corner with better spacing
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  
  // Handle long branch names by truncating if necessary
  const maxBranchWidth = availableWidth * 0.3; // Use max 30% of available width
  let branchText = branch.name;
  const textWidth = doc.getTextWidth(branchText);
  
  if (textWidth > maxBranchWidth) {
    // Truncate and add ellipsis if too long
    while (doc.getTextWidth(branchText + '...') > maxBranchWidth && branchText.length > 0) {
      branchText = branchText.slice(0, -1);
    }
    branchText += '...';
  }
  
  doc.text(branchText, startX + availableWidth - contentPadding - 2, yPos + 8, { align: 'right' });
  
  // Draw line under payslip header
  doc.setLineWidth(0.3);
  doc.line(startX + contentPadding, yPos + 15, startX + availableWidth - contentPadding, yPos + 15);
  
  const headerBottom = yPos + headerHeight;
  
  // Employee information section
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  
  const employeeInfo = [
    [`Emp No: ${employee.employee_id || ''}`, `Employee Name: ${employee.name || ''}`],
    [`Designation: ${employee.position || ''}`, `Date of Join: ${employee.join_date || ''}`],
    [`Report Month: ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}`, `Working Days: ${workedDays}`],
    [`Generated: ${new Date().toLocaleDateString()}`, `OT Hrs: ${stats.ot_hours.toFixed(1)} hrs`],
    [`PF: ${employee.pf_number || 'N/A'}`, `ESI: ${employee.esi_number || 'N/A'}`]
  ];
  
  let infoY = headerBottom + 4;
  const infoLineHeight = 4.5;
  employeeInfo.forEach(([left, right]) => {
    doc.text(left, startX + contentPadding, infoY);
    doc.text(right, startX + availableWidth/2 + contentPadding + 2, infoY);
    infoY += infoLineHeight;
  });
  
  // Earnings and Deductions section with improved spacing
  const tableStartY = headerBottom + infoHeight + 2;
  const earningsX = startX + contentPadding;
  const deductionsX = startX + availableWidth/2 + contentPadding + 35; // Increased spacing from +20 to +35
  const columnWidth = (availableWidth/2) - (2 * contentPadding) - 20; // Increased width by reducing margin from -12 to -20
  
  // Headers with improved positioning
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Earnings', earningsX, tableStartY);
  doc.text('Amount', earningsX + columnWidth - 15, tableStartY, { align: 'right' }); // Adjusted positioning
  
  doc.text('Deductions', deductionsX, tableStartY);
  doc.text('Amount', deductionsX + columnWidth - 15, tableStartY, { align: 'right' }); // Adjusted positioning
  
  // Draw lines under headers
  doc.setLineWidth(0.2);
  doc.line(earningsX, tableStartY + 1, earningsX + columnWidth - 8, tableStartY + 1); // Adjusted line length
  doc.line(deductionsX, tableStartY + 1, deductionsX + columnWidth - 8, tableStartY + 1); // Adjusted line length
  
  // Data
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  const earnings = [
    ['Basic + D.A', basicPlusDA.toFixed(2)],
    ['HRA', hraAmount.toFixed(2)],
    ['Allowance', allowancesAmount.toFixed(2)],
    ['Incentive', (employee.other_allowances || 0).toFixed(2)],
    ['Overtime Amount', otAmount.toFixed(2)],
    ['Trim Allowance', (employee.shoe_uniform_allowance || 0).toFixed(2)]
  ];
  
  const deductions = [
    ['PF', pf.toFixed(2)],
    ['ESI', esi > 0 ? esi.toFixed(2) : 'N/A'],
    ['Rent Deduction', rentDeduction.toFixed(2)],
    ['Advance', advanceDeduction.toFixed(2)],
    ['Uniform', uniformDeduction.toFixed(2)],
    ['Food', foodDeduction.toFixed(2)]
  ];
  
  let dataY = tableStartY + 4;
  const dataLineHeight = 4.2;
  const maxRows = Math.max(earnings.length, deductions.length); // Display all rows
  
  for (let i = 0; i < maxRows; i++) {
    if (earnings[i]) {
      doc.text(earnings[i][0], earningsX, dataY);
      doc.text(earnings[i][1], earningsX + columnWidth - 15, dataY, { align: 'right' }); // Adjusted positioning
    }
    if (deductions[i]) {
      doc.text(deductions[i][0], deductionsX, dataY);
      doc.text(deductions[i][1], deductionsX + columnWidth - 15, dataY, { align: 'right' }); // Adjusted positioning
    }
    dataY += dataLineHeight;
  }
  
  // Totals - positioned after table data
  let totalsY = dataY + 2;
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);
  doc.text('Total Earnings', earningsX, totalsY);
  doc.text(grossEarnings.toFixed(2), earningsX + columnWidth - 15, totalsY, { align: 'right' }); // Adjusted positioning
  doc.text('Total Deductions', deductionsX, totalsY);
  doc.text(totalDeductions.toFixed(2), deductionsX + columnWidth - 15, totalsY, { align: 'right' }); // Adjusted positioning
  
  // NET PAY - positioned below the totals section
  const netPayHeight = 10;
  const netPayY = totalsY + 6; // Position below totals with gap
  
  doc.setLineWidth(0.5);
  doc.rect(startX + contentPadding, netPayY, availableWidth - (2 * contentPadding), netPayHeight);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  
  // Simple text positioning without alignment to prevent extra characters
  const netPayText = `NET PAY: ${netPay.toFixed(2)}`;
  const textX = startX + availableWidth/2;
  const textY = netPayY + netPayHeight/2 + 2;
  doc.text(netPayText, textX, textY, { align: 'center' });
  
  
  return yPosition + sectionHeight + sectionGap; // Return next Y position with gap
};