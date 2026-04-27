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
