import { describe, expect, it } from 'vitest'
import { unauditedMutations } from './doctor-audit-coverage'

const resolver = (body: string) => `
import { Mutation, Resolver } from '@nestjs/graphql'
${body}
`

describe('unauditedMutations', () => {
  it('judges each mutation on its own: one audited mutation does not certify its neighbour', () => {
    // The case that found it: two resolver classes in one file, only one of which audits.
    const source = resolver(`
@Resolver()
export class AdminComputeBillingResolver {
  @Mutation(() => Boolean)
  adminAdjustCredits() {
    this.audit.log('credits.adjusted')
    return true
  }
}

@Resolver()
export class ComputeBillingResolver {
  @Mutation(() => Boolean)
  updateComputeBillingSettings() {
    return this.settings.save()
  }
}
`)

    expect(unauditedMutations(source, []).map((mutation) => mutation.name)).toEqual(['updateComputeBillingSettings'])
  })

  it('accepts an audit made by the service method the mutation calls', () => {
    const source = resolver(`
@Resolver()
export class BillingResolver {
  constructor(private readonly billing: BillingService) {}

  @Mutation(() => Boolean)
  updatePlan() {
    return this.billing.updatePlan()
  }
}
`)
    const service = `
export class BillingService {
  updatePlan() {
    this.recordAuditLog('plan.updated')
  }
  unrelated() {}
}
`

    expect(unauditedMutations(source, [service])).toEqual([])
  })

  it('does not accept an audit made by a different method of the same service', () => {
    const source = resolver(`
@Resolver()
export class BillingResolver {
  constructor(private readonly billing: BillingService) {}

  @Mutation(() => Boolean)
  setSpendingLimit() {
    return this.billing.setSpendingLimit()
  }
}
`)
    const service = `
export class BillingService {
  setSpendingLimit() {
    return this.prisma.limit.update({})
  }
  refund() {
    this.audit.log('refund')
  }
}
`

    expect(unauditedMutations(source, [service]).map((mutation) => mutation.name)).toEqual(['setSpendingLimit'])
  })

  it('follows calls through helpers, a few levels deep', () => {
    const source = resolver(`
@Resolver()
export class RoleResolver {
  constructor(private readonly roles: RoleService) {}

  @Mutation(() => Boolean)
  grantRole() {
    return this.roles.grant()
  }
}
`)
    const service = `
export class RoleService {
  grant() {
    return this.persistGrant()
  }
  persistGrant() {
    this.securityEvents.record()
  }
}
`

    expect(unauditedMutations(source, [service])).toEqual([])
  })

  it('follows a call to the service the field is typed as, not any service with that method name', () => {
    const source = resolver(`
@Resolver()
export class OrderResolver {
  constructor(private readonly orders: OrdersService) {}

  @Mutation(() => Boolean)
  updateOrder() {
    return this.orders.update()
  }
}
`)
    const orders = `
export class OrdersService {
  update() {
    return this.prisma.order.update({})
  }
}
`
    const invoices = `
export class InvoicesService {
  update() {
    this.audit.log('invoice.updated')
  }
}
`

    expect(unauditedMutations(source, [orders, invoices]).map((mutation) => mutation.name)).toEqual(['updateOrder'])
  })

  it('does not follow a call through a field whose type is unknown', () => {
    const source = resolver(`
@Resolver()
export class OrderResolver {
  @Mutation(() => Boolean)
  updateOrder() {
    return this.orders.update()
  }
}
`)
    const audited = `
export class OrdersService {
  update() {
    this.audit.log('order.updated')
  }
}
`

    expect(unauditedMutations(source, [audited]).map((mutation) => mutation.name)).toEqual(['updateOrder'])
  })

  it('ignores queries', () => {
    const source = resolver(`
@Resolver()
export class UserResolver {
  @Query(() => Boolean)
  me() {
    return true
  }
}
`)

    expect(unauditedMutations(source, [])).toEqual([])
  })
})
