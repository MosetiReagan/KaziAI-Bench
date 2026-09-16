// Buggy webhook receiver: lacks idempotency deduplication!
let processedCount = 0;

function handleWebhook(event) {
  // BUG: Does not check if event.id was already processed!
  // Re-executes charge/side-effects on duplicate delivery
  processedCount++;

  return {
    statusCode: 200,
    processed: true,
    eventId: event.id,
    processedCount,
  };
}

function getProcessedCount() {
  return processedCount;
}

function resetCount() {
  processedCount = 0;
}

module.exports = { handleWebhook, getProcessedCount, resetCount };
