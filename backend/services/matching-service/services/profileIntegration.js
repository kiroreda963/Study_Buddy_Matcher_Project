const PROFILE_SERVICE_URL =
  process.env.PROFILE_SERVICE_URL || "http://localhost:4002/";

async function graphQLRequest(query, variables = {}, authToken = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(PROFILE_SERVICE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Profile service request failed with status ${response.status}`
    );
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || "Profile service GraphQL error");
  }

  return payload.data;
}

async function fetchProfileByUserId(userId, authToken = null) {
  const data = await graphQLRequest(
    `
      query GetProfile($userId: String!) {
        getProfile(userId: $userId) {
          userId
          courses { name }
          topics { name }
          preferences {
            studyPace
            studyMode
            groupSize
            studyStyle
          }
        }
      }
    `,
    { userId: String(userId) },
    authToken
  );

  return data?.getProfile || null;
}

module.exports = {
  fetchProfileByUserId,
};
