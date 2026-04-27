import { errAsync, ResultAsync } from "neverthrow";
import { createP2PError, type P2PError } from "../shared";

export type SubgraphError = P2PError<"subgraph">;

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

export async function querySubgraph(params: {
  query: string;
  variables?: Record<string, unknown>;
}) {
  const url = SUBGRAPH_URL;
  const urlLabel = "VITE_SUBGRAPH_URL";

  if (!url) {
    return errAsync(
      createP2PError(`Subgraph URL not configured (${urlLabel})`, {
        domain: "subgraph",
        code: "P2PSubgraphError",
        cause: `${urlLabel} is not set in environment variables`,
        context: {
          [urlLabel]: url,
        },
      }),
    );
  }

  const fetcher = async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
      }),
    });

    if (!response.ok) {
      throw createP2PError(
        `Fetch response (status: ${response.status}) is not ok`,
        {
          domain: "subgraph",
          code: "P2PSubgraphError",
          cause: response,
          context: {
            response,
          },
        },
      );
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      throw createP2PError("Subgraph returned GraphQL errors", {
        domain: "subgraph",
        code: "P2PSubgraphError",
        cause: json.errors,
        context: { errors: json.errors },
      });
    }

    if (!json.data) {
      throw createP2PError("Subgraph returned no data", {
        domain: "subgraph",
        code: "P2PSubgraphError",
        cause: "Missing data field in GraphQL response",
        context: { response: json },
      });
    }

    return json.data;
  };

  return ResultAsync.fromPromise(fetcher(), (error) => error as SubgraphError);
}
