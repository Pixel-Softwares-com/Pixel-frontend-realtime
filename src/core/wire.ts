/**
 * Normalizes an event name to its Pusher/Echo "wire" form.
 *
 * Laravel broadcasts custom event names (via `broadcastAs`) without the
 * framework namespace, and Echo requires a leading `.` to listen for them.
 * This helper adds that dot if the caller did not, so both the notifications
 * and custom-channels listeners stay consistent.
 */
export function toWireEvent(event: string): string {
  const value = event.trim();

  if (!value) {
    throw new Error('Event name is required.');
  }

  return value.startsWith('.') ? value : `.${value}`;
}
