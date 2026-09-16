#!/usr/bin/env bash
cat << 'EOF' > receiver.js
let processedCount = 0;
const processedEvents = new Set();

function handleWebhook(event) {
  if (!event || !event.id) {
    return { statusCode: 400, error: "Missing event ID" };
  }

  // Idempotency check: if previously processed, return success without re-executing
  if (processedEvents.has(event.id)) {
    return {
      statusCode: 200,
      processed: false,
      eventId: event.id,
      duplicate: true,
      processedCount,
    };
  }

  processedEvents.add(event.id);
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
  processedEvents.clear();
}

module.exports = { handleWebhook, getProcessedCount, resetCount };
EOF
