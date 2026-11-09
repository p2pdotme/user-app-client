export const CIRCLES_FOR_ROUTING_QUERY = /* GraphQL */ `
  query CirclesForRouting($currency: Bytes!) {
    circles(
      first: 1000
      where: {
        currency: $currency
        metrics_: {
          circleStatus_in: ["active", "bootstrap", "paused"]
        }
      }
    ) {
      circleId
      currency
      metrics {
        circleScore
        circleStatus
        scoreState {
          activeMerchantsCount
        }
      }
    }
  }
`;

export const ORDERS_COLLECTION_QUERY = /* GraphQL */ `
  query OrdersCollection(
    $userAddress: String!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "placedAt"
    $orderDirection: String = "desc"
  ) {
    orders_collection(
      where: { userAddress: $userAddress }
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      orderId
      type
      status
      placedAt
      usdcAmount
      fiatAmount
      currency
      disputeStatus
      disputeRedactTransId
      disputeAccountNumber
      disputeSettledByAddr
    }
  }
`;

export const PROCESSING_ORDERS_COLLECTION_QUERY = /* GraphQL */ `
  query ProcessingOrdersCollection(
    $userAddress: String!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "placedAt"
    $orderDirection: String = "desc"
    $oneHourAgo: Int!
  ) {
    orders_collection(
      where: {
        userAddress: $userAddress
        status_not_in: [3, 4]
        placedAt_gte: $oneHourAgo
      }
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      orderId
      type
      status
      placedAt
      usdcAmount
      fiatAmount
      currency
      disputeStatus
      disputeRedactTransId
      disputeAccountNumber
      disputeSettledByAddr
    }
  }
`;

export const USER_P2P_STAKE_ACTIVITIES_QUERY = /* GraphQL */ `
  query UserP2PStakeActivities(
    $userAddress: String!
    $first: Int = 100
    $skip: Int = 0
  ) {
    userP2PStakeActivities(
      where: { userAddress: $userAddress }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      activityType
      amount
      newTotal
      cooldownEnd
      fraudReserve
      stakedAmountAfter
      statusAfter
      timestamp
      transactionHash
    }
  }
`;

export const ORDERS_COLLECTION_WITH_DATE_FILTER_QUERY = /* GraphQL */ `
  query OrdersCollectionWithDateFilter(
    $userAddress: String!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "placedAt"
    $orderDirection: String = "desc"
    $placedAtGte: Int
    $placedAtLte: Int
  ) {
    orders_collection(
      where: {
        userAddress: $userAddress
        placedAt_gte: $placedAtGte
        placedAt_lte: $placedAtLte
      }
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      orderId
      type
      status
      placedAt
      usdcAmount
      fiatAmount
      currency
      disputeStatus
      disputeRedactTransId
      disputeAccountNumber
      disputeSettledByAddr
    }
  }
`;

/** One order by id, with the dispute outcome fields the list queries omit. */
export const ORDER_BY_ID_QUERY = /* GraphQL */ `
  query OrderById($orderId: BigInt!) {
    orders_collection(where: { orderId: $orderId }, first: 1) {
      orderId
      type
      status
      placedAt
      usdcAmount
      fiatAmount
      currency
      disputeStatus
      disputeRedactTransId
      disputeAccountNumber
      disputeSettledByAddr
      disputeFaultType
      disputeSettledAt
      disputeTier
    }
  }
`;

/** The dispute ladder steps indexed for one order (raised / decided / escalated / settled). */
export const DISPUTE_HISTORY_QUERY = /* GraphQL */ `
  query DisputeHistory($orderId: BigInt!) {
    disputeSteps(
      where: { orderId: $orderId }
      orderBy: blockTimestamp
      orderDirection: asc
      first: 50
    ) {
      id
      kind
      tier
      fromTier
      faultType
      by
      finalizedBy
      deadline
      slaLapsed
      blockTimestamp
      transactionHash
    }
  }
`;
