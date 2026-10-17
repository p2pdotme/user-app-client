import { ResultAsync } from "neverthrow";
import {
  type OrderByIdQueryParams,
  type OrdersCollectionQueryParams,
  type OrdersCollectionWithDateFilterQueryParams,
  type ProcessingOrdersCollectionQueryParams,
  type UserP2PStakeActivitiesQueryParams,
  validate,
  ZodCirclesForRoutingResponseSchema,
  ZodDisputeHistorySchema,
  ZodOrderByIdQueryParamsSchema,
  ZodOrdersCollectionQueryParamsSchema,
  ZodOrdersCollectionSchema,
  ZodOrdersCollectionWithDateFilterQueryParamsSchema,
  ZodProcessingOrdersCollectionQueryParamsSchema,
  ZodUserP2PStakeActivitiesQueryParamsSchema,
  ZodUserP2PStakeActivitiesResponseSchema,
} from "../shared";
import { querySubgraph } from "./client";
import {
  CIRCLES_FOR_ROUTING_QUERY,
  DISPUTE_HISTORY_QUERY,
  ORDER_BY_ID_QUERY,
  ORDERS_COLLECTION_QUERY,
  ORDERS_COLLECTION_WITH_DATE_FILTER_QUERY,
  PROCESSING_ORDERS_COLLECTION_QUERY,
  USER_P2P_STAKE_ACTIVITIES_QUERY,
} from "./queries";

export function getOrdersCollection(params: OrdersCollectionQueryParams) {
  return validate(ZodOrdersCollectionQueryParamsSchema, params).asyncAndThen(
    () =>
      ResultAsync.fromPromise(
        querySubgraph({
          query: ORDERS_COLLECTION_QUERY,
          variables: params,
        }),
        (error) => error,
      ).andThen((queryResult) =>
        queryResult
          .andThen((data) => validate(ZodOrdersCollectionSchema, data))
          .map((validated) => validated.orders_collection),
      ),
  );
}

export function getOrdersCollectionWithDateFilter(
  params: OrdersCollectionWithDateFilterQueryParams,
) {
  return validate(
    ZodOrdersCollectionWithDateFilterQueryParamsSchema,
    params,
  ).asyncAndThen(() =>
    ResultAsync.fromPromise(
      querySubgraph({
        query: ORDERS_COLLECTION_WITH_DATE_FILTER_QUERY,
        variables: params,
      }),
      (error) => error,
    ).andThen((queryResult) =>
      queryResult
        .andThen((data) => validate(ZodOrdersCollectionSchema, data))
        .map((validated) => validated.orders_collection),
    ),
  );
}

export function getProcessingOrdersCollection(
  params: ProcessingOrdersCollectionQueryParams,
) {
  return validate(
    ZodProcessingOrdersCollectionQueryParamsSchema,
    params,
  ).asyncAndThen(() =>
    ResultAsync.fromPromise(
      querySubgraph({
        query: PROCESSING_ORDERS_COLLECTION_QUERY,
        variables: params,
      }),
      (error) => error,
    ).andThen((queryResult) =>
      queryResult
        .andThen((data) => validate(ZodOrdersCollectionSchema, data))
        .map((validated) => validated.orders_collection),
    ),
  );
}

export function getUserP2PStakeActivities(
  params: UserP2PStakeActivitiesQueryParams,
) {
  return validate(
    ZodUserP2PStakeActivitiesQueryParamsSchema,
    params,
  ).asyncAndThen(() =>
    ResultAsync.fromPromise(
      querySubgraph({
        query: USER_P2P_STAKE_ACTIVITIES_QUERY,
        variables: params,
      }),
      (error) => error,
    ).andThen((queryResult) =>
      queryResult
        .andThen((data) =>
          validate(ZodUserP2PStakeActivitiesResponseSchema, data),
        )
        .map((validated) => validated.userP2PStakeActivities),
    ),
  );
}

export function getCirclesForRouting(currency: string) {
  return ResultAsync.fromPromise(
    querySubgraph({
      query: CIRCLES_FOR_ROUTING_QUERY,
      variables: { currency },
    }),
    (error) => error,
  ).andThen((queryResult) =>
    queryResult.andThen((data) =>
      validate(ZodCirclesForRoutingResponseSchema, data).map((validated) =>
        validated.circles?.filter(
          (item) => Number(item.metrics.scoreState.activeMerchantsCount) > 0,
        ),
      ),
    ),
  );
}

/** A single order's subgraph row (null when not indexed yet). */
export function getSubgraphOrderById(params: OrderByIdQueryParams) {
  return validate(ZodOrderByIdQueryParamsSchema, params).asyncAndThen(() =>
    ResultAsync.fromPromise(
      querySubgraph({
        query: ORDER_BY_ID_QUERY,
        variables: params,
      }),
      (error) => error,
    ).andThen((queryResult) =>
      queryResult
        .andThen((data) => validate(ZodOrdersCollectionSchema, data))
        .map((validated) => validated.orders_collection[0] ?? null),
    ),
  );
}

/** Ordered dispute ladder steps for one order (empty until indexed). */
export function getDisputeHistory(params: OrderByIdQueryParams) {
  return validate(ZodOrderByIdQueryParamsSchema, params).asyncAndThen(() =>
    ResultAsync.fromPromise(
      querySubgraph({
        query: DISPUTE_HISTORY_QUERY,
        variables: params,
      }),
      (error) => error,
    ).andThen((queryResult) =>
      queryResult
        .andThen((data) => validate(ZodDisputeHistorySchema, data))
        .map((validated) => validated.disputeSteps),
    ),
  );
}
