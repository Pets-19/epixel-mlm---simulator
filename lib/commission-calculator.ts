import { StandardCommission, CustomCommission, CommissionConfig } from '@/components/commission-step'

export interface CommissionCalculation {
  commission_type: string
  commission_name: string
  amount: number
  percentage: number
  level: number
  volume: number
  description: string
}

export interface CommissionSummary {
  total_commission: number
  breakdown: CommissionCalculation[]
  standard_commissions: CommissionCalculation[]
  custom_commissions: CommissionCalculation[]
}

export class CommissionCalculator {
  private config: CommissionConfig

  constructor(config: CommissionConfig) {
    this.config = config
  }

  /**
   * Calculate commissions for a given user level and volume
   */
  calculateCommissions(
    userLevel: number,
    personalVolume: number,
    teamVolume: number,
    genealogyStructure: any
  ): CommissionSummary {
    const standardCommissions = this.calculateStandardCommissions(
      userLevel,
      personalVolume,
      teamVolume,
      genealogyStructure
    )

    const customCommissions = this.calculateCustomCommissions(
      userLevel,
      personalVolume,
      teamVolume,
      genealogyStructure
    )

    const allCommissions = [...standardCommissions, ...customCommissions]
    const totalCommission = allCommissions.reduce((sum, comm) => sum + comm.amount, 0)

    return {
      total_commission: totalCommission,
      breakdown: allCommissions,
      standard_commissions: standardCommissions,
      custom_commissions: customCommissions
    }
  }

  /**
   * Calculate standard commissions based on type
   */
  private calculateStandardCommissions(
    userLevel: number,
    personalVolume: number,
    teamVolume: number,
    genealogyStructure: any
  ): CommissionCalculation[] {
    const commissions: CommissionCalculation[] = []

    for (const commission of this.config.standard_commissions) {
      if (!commission.is_enabled) continue

      let amount = 0
      let level = 0
      let volume = 0
      let description = ''

      switch (commission.type) {
        case 'binary':
          amount = this.calculateBinaryCommission(commission, teamVolume, genealogyStructure)
          volume = teamVolume
          description = `Binary commission from team volume of $${teamVolume.toFixed(2)}`
          break

        case 'sales':
          amount = this.calculateSalesCommission(commission, personalVolume, teamVolume)
          volume = personalVolume + teamVolume
          description = `Sales commission from personal ($${personalVolume.toFixed(2)}) and team ($${teamVolume.toFixed(2)}) volume`
          break

        case 'referral':
          amount = this.calculateReferralCommission(commission, personalVolume)
          volume = personalVolume
          description = `Referral commission from personal volume of $${personalVolume.toFixed(2)}`
          break

        case 'unilevel':
          amount = this.calculateUnilevelCommission(commission, userLevel, teamVolume, genealogyStructure)
          level = userLevel
          volume = teamVolume
          description = `Unilevel commission from level ${userLevel} with team volume of $${teamVolume.toFixed(2)}`
          break

        case 'fast_start':
          amount = this.calculateFastStartCommission(commission, userLevel, teamVolume)
          level = userLevel
          volume = teamVolume
          description = `Fast start commission from level ${userLevel} with team volume of $${teamVolume.toFixed(2)}`
          break
      }

      if (amount > 0) {
        commissions.push({
          commission_type: commission.type,
          commission_name: commission.name,
          amount,
          percentage: commission.percentage,
          level,
          volume,
          description
        })
      }
    }

    return commissions
  }

  /**
   * Calculate custom commissions based on trigger conditions
   */
  private calculateCustomCommissions(
    userLevel: number,
    personalVolume: number,
    teamVolume: number,
    genealogyStructure: any
  ): CommissionCalculation[] {
    const commissions: CommissionCalculation[] = []

    for (const commission of this.config.custom_commissions) {
      if (!commission.is_enabled) continue

      let amount = 0
      let level = 0
      let volume = 0
      let description = ''

      // Check if trigger conditions are met
      if (this.isCustomCommissionTriggered(commission, userLevel, personalVolume, teamVolume)) {
        switch (commission.trigger_type) {
          case 'volume':
            volume = teamVolume
            amount = (teamVolume * commission.percentage) / 100
            description = `Custom volume-based commission from team volume of $${teamVolume.toFixed(2)}`
            break

          case 'level':
            level = userLevel
            amount = (personalVolume * commission.percentage) / 100
            volume = personalVolume
            description = `Custom level-based commission from level ${userLevel} with personal volume of $${personalVolume.toFixed(2)}`
            break

          case 'milestone':
            volume = teamVolume
            amount = (commission.trigger_value * commission.percentage) / 100
            description = `Custom milestone commission for reaching $${commission.trigger_value.toFixed(2)} team volume`
            break
        }

        // Apply max volume limit if specified
        if (commission.max_volume && amount > (commission.max_volume * commission.percentage) / 100) {
          amount = (commission.max_volume * commission.percentage) / 100
        }

        if (amount > 0) {
          commissions.push({
            commission_type: 'custom',
            commission_name: commission.name,
            amount,
            percentage: commission.percentage,
            level,
            volume,
            description
          })
        }
      }
    }

    return commissions
  }

  /**
   * Calculate binary commission
   */
  private calculateBinaryCommission(
    commission: StandardCommission,
    teamVolume: number,
    genealogyStructure: any
  ): number {
    if (teamVolume < (commission.min_volume || 0)) return 0
    if (commission.max_volume && teamVolume > commission.max_volume) {
      teamVolume = commission.max_volume
    }

    // Binary commission is typically calculated on the weaker leg
    const leftLegVolume = genealogyStructure?.left_leg_volume || 0
    const rightLegVolume = genealogyStructure?.right_leg_volume || 0
    const weakerLegVolume = Math.min(leftLegVolume, rightLegVolume)

    return (weakerLegVolume * commission.percentage) / 100
  }

  /**
   * Calculate sales commission
   */
  private calculateSalesCommission(
    commission: StandardCommission,
    personalVolume: number,
    teamVolume: number
  ): number {
    let totalVolume = personalVolume + teamVolume
    if (totalVolume < (commission.min_volume || 0)) return 0
    if (commission.max_volume && totalVolume > commission.max_volume) {
      totalVolume = commission.max_volume
    }

    return (totalVolume * commission.percentage) / 100
  }

  /**
   * Calculate referral commission
   */
  private calculateReferralCommission(
    commission: StandardCommission,
    personalVolume: number
  ): number {
    if (personalVolume < (commission.min_volume || 0)) return 0
    if (commission.max_volume && personalVolume > commission.max_volume) {
      personalVolume = commission.max_volume
    }

    return (personalVolume * commission.percentage) / 100
  }

  /**
   * Calculate unilevel commission
   */
  private calculateUnilevelCommission(
    commission: StandardCommission,
    userLevel: number,
    teamVolume: number,
    genealogyStructure: any
  ): number {
    if (userLevel > (commission.max_level || 999)) return 0
    if (teamVolume < (commission.min_volume || 0)) return 0
    if (commission.max_volume && teamVolume > commission.max_volume) {
      teamVolume = commission.max_volume
    }

    // Unilevel commission decreases with level
    const levelMultiplier = Math.max(0.1, 1 - (userLevel - 1) * 0.1)
    return (teamVolume * commission.percentage * levelMultiplier) / 100
  }

  /**
   * Calculate fast start commission
   */
  private calculateFastStartCommission(
    commission: StandardCommission,
    userLevel: number,
    teamVolume: number
  ): number {
    if (userLevel > (commission.max_level || 999)) return 0
    if (teamVolume < (commission.min_volume || 0)) return 0
    if (commission.max_volume && teamVolume > commission.max_volume) {
      teamVolume = commission.max_volume
    }

    // Fast start commission is higher for early levels
    const levelMultiplier = Math.max(0.5, 1.5 - (userLevel - 1) * 0.2)
    return (teamVolume * commission.percentage * levelMultiplier) / 100
  }

  /**
   * Check if custom commission trigger conditions are met
   */
  private isCustomCommissionTriggered(
    commission: CustomCommission,
    userLevel: number,
    personalVolume: number,
    teamVolume: number
  ): boolean {
    switch (commission.trigger_type) {
      case 'volume':
        return teamVolume >= commission.trigger_value
      case 'level':
        return userLevel >= commission.trigger_value
      case 'milestone':
        return teamVolume >= commission.trigger_value
      default:
        return false
    }
  }

  /**
   * Get commission summary for display
   */
  getCommissionSummary(): {
    total_percentage: number
    active_standard: number
    active_custom: number
    standard_types: string[]
  } {
    const activeStandard = this.config.standard_commissions.filter(c => c.is_enabled)
    const activeCustom = this.config.custom_commissions.filter(c => c.is_enabled)
    
    const totalPercentage = activeStandard.reduce((sum, c) => sum + c.percentage, 0) +
                           activeCustom.reduce((sum, c) => sum + c.percentage, 0)

    return {
      total_percentage: totalPercentage,
      active_standard: activeStandard.length,
      active_custom: activeCustom.length,
      standard_types: activeStandard.map(c => c.type)
    }
  }
}
