import {
  branchLastCommitQuery,
  serverInfoQuery,
  streamCommitQuery
} from "./speckleQueries.js";

export let SERVER_URL = window.location.origin;

// Unauthorised fetch, without token to prevent use of localStorage or exposing elsewhere.
export async function speckleFetch(query, variables) {
  try {
    var res = await fetch(`${SERVER_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    });
    return await res.json();
  } catch (err) {
    console.error("API call failed", err);
  }
}

export const getServerInfo = () => speckleFetch(serverInfoQuery);
export const getLatestBranchCommit = (id, branch) => speckleFetch(branchLastCommitQuery, { id, branch });
export const getCommit = (id, commit) => speckleFetch(streamCommitQuery, { id, commit });
