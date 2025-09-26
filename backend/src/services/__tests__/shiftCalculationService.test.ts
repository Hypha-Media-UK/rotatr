import { ShiftCalculationService } from '../shiftCalculationService'
import { testUtils } from '../../../tests/setup'

describe('ShiftCalculationService', () => {
  let service: ShiftCalculationService

  beforeEach(() => {
    service = new ShiftCalculationService()
  })

  afterEach(async () => {
    await testUtils.cleanupTestData()
  })

  describe('calculateShiftPattern', () => {
    it('should calculate correct shift pattern for 4-on/4-off cycle', () => {
      const groundZero = new Date('2024-01-01') // Monday
      const targetDate = new Date('2024-01-05') // Friday
      const daysOn = 4
      const daysOff = 4
      const offsetDays = 0

      const result = service.calculateShiftPattern(groundZero, targetDate, daysOn, daysOff, offsetDays)

      expect(result).toEqual({
        isWorking: true,
        cycleDay: 5,
        cyclePosition: 'working',
        nextChangeDate: new Date('2024-01-05'),
        shiftStartTime: '07:00:00',
        shiftEndTime: '19:00:00'
      })
    })

    it('should handle offset days correctly', () => {
      const groundZero = new Date('2024-01-01')
      const targetDate = new Date('2024-01-01')
      const daysOn = 4
      const daysOff = 4
      const offsetDays = 2

      const result = service.calculateShiftPattern(groundZero, targetDate, daysOn, daysOff, offsetDays)

      expect(result.isWorking).toBe(true)
      expect(result.cycleDay).toBe(3)
    })

    it('should calculate off days correctly', () => {
      const groundZero = new Date('2024-01-01')
      const targetDate = new Date('2024-01-06') // Should be off day
      const daysOn = 4
      const daysOff = 4
      const offsetDays = 0

      const result = service.calculateShiftPattern(groundZero, targetDate, daysOn, daysOff, offsetDays)

      expect(result.isWorking).toBe(false)
      expect(result.cyclePosition).toBe('off')
    })
  })

  describe('isPorterWorkingOnDate', () => {
    it('should return true for porter working on given date', async () => {
      const porter = await testUtils.createTestPorter({
        shift_type: 'Day A',
        shift_offset_days: 0
      })

      const testDate = new Date('2024-01-02') // Should be working day
      const result = await service.isPorterWorkingOnDate(porter.id, testDate)

      expect(result).toBe(true)
    })

    it('should return false for porter not working on given date', async () => {
      const porter = await testUtils.createTestPorter({
        shift_type: 'Day A',
        shift_offset_days: 0
      })

      const testDate = new Date('2024-01-06') // Should be off day
      const result = await service.isPorterWorkingOnDate(porter.id, testDate)

      expect(result).toBe(false)
    })

    it('should handle non-existent porter', async () => {
      const result = await service.isPorterWorkingOnDate(99999, new Date())
      expect(result).toBe(false)
    })
  })

  describe('getPorterAvailability', () => {
    it('should return availability with no conflicts', async () => {
      const porter = await testUtils.createTestPorter()
      const testDate = new Date('2024-01-02')

      const result = await service.getPorterAvailability(porter.id, testDate)

      expect(result).toEqual({
        isWorking: expect.any(Boolean),
        isAvailable: expect.any(Boolean),
        conflicts: expect.any(Array),
        shiftDetails: expect.any(Object)
      })
    })

    it('should detect absence conflicts', async () => {
      const porter = await testUtils.createTestPorter()
      const testDate = new Date('2024-01-02')

      // Create an absence for this porter
      await database.query(
        'INSERT INTO absences (porter_id, start_date, end_date, absence_type) VALUES (?, ?, ?, ?)',
        [porter.id, testDate.toISOString().split('T')[0], testDate.toISOString().split('T')[0], 'Sick Leave']
      )

      const result = await service.getPorterAvailability(porter.id, testDate)

      expect(result.isAvailable).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('absence')
    })

    it('should detect assignment conflicts', async () => {
      const porter = await testUtils.createTestPorter()
      const testDate = new Date('2024-01-02')

      // Create an existing assignment
      await testUtils.createTestAssignment({
        porter_id: porter.id,
        assignment_date: testDate.toISOString().split('T')[0]
      })

      const result = await service.getPorterAvailability(porter.id, testDate)

      expect(result.conflicts.some(c => c.type === 'assignment')).toBe(true)
    })
  })

  describe('getWorkingPortersForDate', () => {
    it('should return all working porters for a given date', async () => {
      const porter1 = await testUtils.createTestPorter({
        shift_type: 'Day A',
        shift_offset_days: 0
      })
      const porter2 = await testUtils.createTestPorter({
        shift_type: 'Day A',
        shift_offset_days: 4 // Different offset
      })

      const testDate = new Date('2024-01-02')
      const result = await service.getWorkingPortersForDate(testDate)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that returned porters have required properties
      result.forEach(porter => {
        expect(porter).toBeValidPorter()
        expect(porter.isWorking).toBe(true)
      })
    })

    it('should filter by department when specified', async () => {
      const department = await testUtils.createTestDepartment()
      const porter = await testUtils.createTestPorter({
        regular_department_id: department.id
      })

      const testDate = new Date('2024-01-02')
      const result = await service.getWorkingPortersForDate(testDate, department.id)

      result.forEach(porter => {
        expect(porter.regular_department_id).toBe(department.id)
      })
    })

    it('should filter by floor staff when specified', async () => {
      const porter = await testUtils.createTestPorter({
        is_floor_staff: true
      })

      const testDate = new Date('2024-01-02')
      const result = await service.getWorkingPortersForDate(testDate, undefined, true)

      result.forEach(porter => {
        expect(porter.is_floor_staff).toBe(true)
      })
    })
  })

  describe('calculateStaffingLevels', () => {
    it('should calculate staffing levels for all departments', async () => {
      const department = await testUtils.createTestDepartment({
        default_porters_required: 3
      })

      const testDate = new Date('2024-01-02')
      const result = await service.calculateStaffingLevels(testDate)

      expect(Array.isArray(result)).toBe(true)
      
      const deptStaffing = result.find(s => s.departmentId === department.id)
      expect(deptStaffing).toBeDefined()
      expect(deptStaffing?.requiredPorters).toBe(3)
      expect(typeof deptStaffing?.availablePorters).toBe('number')
      expect(['Adequate', 'Low', 'Critical']).toContain(deptStaffing?.staffingLevel)
    })

    it('should handle departments with no required porters', async () => {
      const department = await testUtils.createTestDepartment({
        default_porters_required: 0
      })

      const testDate = new Date('2024-01-02')
      const result = await service.calculateStaffingLevels(testDate)

      const deptStaffing = result.find(s => s.departmentId === department.id)
      expect(deptStaffing?.staffingLevel).toBe('Adequate')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid')
      
      expect(() => {
        service.calculateShiftPattern(
          new Date('2024-01-01'),
          invalidDate,
          4,
          4,
          0
        )
      }).toThrow()
    })

    it('should handle zero days on/off', () => {
      const result = service.calculateShiftPattern(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        0,
        4,
        0
      )

      expect(result.isWorking).toBe(false)
    })

    it('should handle negative offset days', () => {
      const result = service.calculateShiftPattern(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        4,
        4,
        -2
      )

      expect(result).toBeDefined()
      expect(typeof result.isWorking).toBe('boolean')
    })
  })

  describe('performance tests', () => {
    it('should calculate availability for multiple porters efficiently', async () => {
      // Create multiple test porters
      const porters = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          testUtils.createTestPorter({ name: `Test Porter ${i}` })
        )
      )

      const testDate = new Date('2024-01-02')
      const startTime = Date.now()

      // Calculate availability for all porters
      const results = await Promise.all(
        porters.map(porter => service.getPorterAvailability(porter.id, testDate))
      )

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(results).toHaveLength(10)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})
