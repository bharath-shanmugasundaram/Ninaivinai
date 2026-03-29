// mockApi.js

/**
 * Simulates calling the Embedding Endpoint and Vector DB to perform Cosine Similarity search.
 * @param {string} query - The search query from the user.
 * @returns {Promise<{text: string, timestamp: number}>} - A mocked response containing a description and the exact timestamp in seconds.
 */
export const searchSemanticIndex = async (query) => {
  // Simulate network latency (e.g., embedding model + DB query)
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowerQuery = query.toLowerCase();

  // Simple keyword heuristic just for mock purposes
  if (lowerQuery.includes('startup') || lowerQuery.includes('funding')) {
    return {
      text: "I found a discussion regarding startup funding strategies. Here is the relevant moment.",
      timestamp: 45 // 45 seconds into the video
    };
  }
  
  if (lowerQuery.includes('design') || lowerQuery.includes('ui')) {
    return {
      text: "The team discusses UI patterns and design language here.",
      timestamp: 120 // 2 minutes
    };
  }

  // Fallback response for any other query
  // Generate a random timestamp between 10s and 60s for demonstration
  const randomTime = Math.floor(Math.random() * 50) + 10;
  return {
    text: `Based on semantic similarity, I found a matching moment for "${query}".`,
    timestamp: randomTime
  };
};
