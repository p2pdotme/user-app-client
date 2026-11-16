import { ResultAsync } from "neverthrow";
import {
  type OrderByIdQueryParams,
  type OrdersCollectionWithDateFilterQueryParams,
  type ProcessingOrdersCollectionQueryParams,
  type UserP2PStakeActivitiesQueryParams,
  validate,
  ZodDisputeHistorySchema,
  ZodOrderByIdQueryParamsSchema,
  ZodOrdersCollectionSchema,
  ZodOrdersCollectionWithDateFilterQueryParamsSchema,
  ZodProcessingOrdersCollectionQueryParamsSchema,
  ZodUserP2PStakeActivitiesQueryParamsSchema,
  ZodUserP2PStakeActivitiesResponseSchema,
} from "../shared";
import { querySubgraph } from "./client";
import {
  DISPUTE_HISTORY_QUERY,
  ORDER_BY_ID_QUERY,
  ORDERS_COLLECTION_WITH_DATE_FILTER_QUERY,
  PROCESSING_ORDERS_COLLECTION_QUERY,
  USER_P2P_STAKE_ACTIVITIES_QUERY,
} from "./queries";

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
