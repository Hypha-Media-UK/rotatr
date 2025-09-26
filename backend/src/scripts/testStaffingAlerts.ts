/**
 * Test script for the Staffing Alert System
 * This script demonstrates the core functionality without the TypeScript route issues
 */

import { staffingAlertService } from '../services/staffingAlertService';
import { shiftCalculationService } from '../services/shiftCalculationService';
import { database } from '../utils/database';

async function testStaffingAlerts() {
  console.log('🔍 Testing Staffing Alert System...\n');

  try {
    // Initialize database connection
    await database.connect();
    console.log('✅ Database connected successfully\n');
    // Test 1: Calculate department staffing for Emergency Department
    console.log('📊 Test 1: Department Staffing Calculation');
    console.log('==========================================');
    
    const emergencyDeptId = 1; // Emergency Department
    const testDate = '2024-12-25'; // Christmas Day - likely to have staffing issues
    
    const departmentStaffing = await staffingAlertService.calculateDepartmentStaffing(emergencyDeptId, testDate);
    
    console.log(`Department: ${departmentStaffing.department.name}`);
    console.log(`Date: ${departmentStaffing.date}`);
    console.log(`Required Porters: ${departmentStaffing.requiredPorters}`);
    console.log(`Available Porters: ${departmentStaffing.availablePorters.length}`);
    console.log(`Staffing Level: ${departmentStaffing.staffingLevel}`);
    console.log(`Existing Alerts: ${departmentStaffing.alerts.length}`);
    
    if (departmentStaffing.availablePorters.length > 0) {
      console.log('\nAvailable Porters:');
      departmentStaffing.availablePorters.forEach(porter => {
        console.log(`  - ${porter.porter.name} (${porter.porter.shift_type}) - Available: ${porter.isAvailable}`);
      });
    }
    
    console.log('\n');

    // Test 2: Generate staffing alerts for the test date
    console.log('🚨 Test 2: Generate Staffing Alerts');
    console.log('===================================');
    
    const generatedAlerts = await staffingAlertService.generateStaffingAlerts(testDate);
    
    console.log(`Generated ${generatedAlerts.length} alerts for ${testDate}`);
    
    if (generatedAlerts.length > 0) {
      console.log('\nGenerated Alerts:');
      generatedAlerts.forEach(alert => {
        console.log(`  - Department ID ${alert.department_id}: ${alert.alert_type}`);
        console.log(`    Time: ${alert.start_time} - ${alert.end_time}`);
        console.log(`    Required: ${alert.required_porters}, Available: ${alert.available_porters}`);
      });
    }
    
    console.log('\n');

    // Test 3: Get daily staffing overview
    console.log('📅 Test 3: Daily Staffing Overview');
    console.log('==================================');
    
    const dailyOverview = await staffingAlertService.getDailyStaffingOverview(testDate);
    
    console.log(`Date: ${dailyOverview.date}`);
    console.log(`Day Shift Floor Staff: ${dailyOverview.dayShift.floorStaff.length}`);
    console.log(`Night Shift Floor Staff: ${dailyOverview.nightShift.floorStaff.length}`);
    console.log(`Day Shift Departments: ${dailyOverview.dayShift.departments.length}`);
    console.log(`Night Shift Departments: ${dailyOverview.nightShift.departments.length}`);
    console.log(`Total Alerts: ${dailyOverview.alerts.length}`);
    
    if (dailyOverview.dayShift.floorStaff.length > 0) {
      console.log('\nDay Shift Floor Staff:');
      dailyOverview.dayShift.floorStaff.forEach(porter => {
        console.log(`  - ${porter.porter.name} (${porter.porter.shift_type})`);
      });
    }
    
    console.log('\n');

    // Test 4: Test shift calculation integration
    console.log('⚙️  Test 4: Shift Calculation Integration');
    console.log('========================================');
    
    // Test a specific porter's working status
    const testPorterId = 1; // John Smith - Day A
    const porterQuery = `
      SELECT * FROM porters WHERE id = ?
    `;
    
    const porters = await database.query(porterQuery, [testPorterId]);
    
    if (porters.length > 0) {
      const porter = porters[0];
      const isWorking = await shiftCalculationService.isPorterWorkingOnDate(porter, testDate);
      const availability = await shiftCalculationService.getPorterAvailability(porter, testDate);
      
      console.log(`Porter: ${porter.name} (${porter.shift_type})`);
      console.log(`Working on ${testDate}: ${isWorking}`);
      console.log(`Available: ${availability.isAvailable}`);
      console.log(`Working Hours: ${availability.workingHours.start} - ${availability.workingHours.end}`);
      
      if (availability.conflictReason) {
        console.log(`Conflict: ${availability.conflictReason}`);
      }
    }
    
    console.log('\n');

    // Test 5: Test different dates to show shift cycle
    console.log('🔄 Test 5: Shift Cycle Demonstration');
    console.log('====================================');
    
    const testDates = ['2024-12-23', '2024-12-24', '2024-12-25', '2024-12-26', '2024-12-27'];
    
    for (const date of testDates) {
      const workingPorters = await shiftCalculationService.getPortersWorkingOnDate(date);
      console.log(`${date}: ${workingPorters.length} porters working`);
    }
    
    console.log('\n✅ Staffing Alert System tests completed successfully!');

    // Close database connection
    await database.disconnect();

  } catch (error) {
    console.error('❌ Error testing staffing alerts:', error);

    // Ensure database is closed even on error
    try {
      await database.disconnect();
    } catch (closeError) {
      // Ignore close errors
    }
  }
}

// Export for potential use in other scripts
export { testStaffingAlerts };

// Run the test if this file is executed directly
if (require.main === module) {
  testStaffingAlerts().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
