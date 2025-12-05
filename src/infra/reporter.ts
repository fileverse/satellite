// Error reporting service
// Example: Slack, Sentry, etc.

class Reporter {
  async reportError(message: string): Promise<void> {
    // Implement your error reporting logic
    console.error('Error reported:', message);
  }
}

export default new Reporter();
