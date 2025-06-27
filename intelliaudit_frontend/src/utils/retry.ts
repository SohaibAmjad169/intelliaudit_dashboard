export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) break;
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}