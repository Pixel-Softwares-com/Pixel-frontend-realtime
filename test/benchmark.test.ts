import { describe, expect, it, vi } from 'vitest';
import {
  createBenchmarkRecorder,
  createRealtimeClient,
  type EchoLike,
  type RealtimeNotification,
} from '../src/index';

class FakeEchoChannel {
  listeners = new Map<string, (payload: unknown) => void>();

  listen(event: string, callback: (payload: unknown) => void): FakeEchoChannel {
    this.listeners.set(event, callback);
    return this;
  }

  stopListening(event: string): FakeEchoChannel {
    this.listeners.delete(event);
    return this;
  }

  emit(event: string, payload: unknown): void {
    const listener = this.listeners.get(event);
    if (!listener) {
      throw new Error(`No listener for ${event}`);
    }
    listener(payload);
  }
}

class FakeEcho implements EchoLike {
  channels = new Map<string, FakeEchoChannel>();

  private(channel: string): FakeEchoChannel {
    const existing = this.channels.get(channel);
    if (existing) {
      return existing;
    }
    const created = new FakeEchoChannel();
    this.channels.set(channel, created);
    return created;
  }

  leave(): void {}
}

const baseNotification = (
  data: Record<string, unknown>,
  overrides: Partial<RealtimeNotification> = {},
): RealtimeNotification => ({
  id: overrides.id ?? 'n-1',
  user_id: overrides.user_id ?? '7',
  user_type: overrides.user_type ?? null,
  type: overrides.type ?? 'pixel.realtime.benchmark',
  title: overrides.title ?? 'Benchmark',
  body: overrides.body ?? null,
  data,
  read_at: null,
  created_at: null,
});

describe('createBenchmarkRecorder', () => {
  it('computes latency from sent_at_ms', () => {
    const recorder = createBenchmarkRecorder({ now: () => 2_000 });

    const sample = recorder.record(
      baseNotification({ benchmark_id: 'b1', sequence: 0, sent_at_ms: 1_500 }),
    );

    expect(sample).toMatchObject({
      benchmark_id: 'b1',
      sequence: 0,
      sent_at_ms: 1_500,
      received_at_ms: 2_000,
      latency_ms: 500,
    });
  });

  it('ignores notifications missing benchmark fields', () => {
    const recorder = createBenchmarkRecorder();

    expect(recorder.record(baseNotification({ invoice_id: 1 }))).toBeNull();
    expect(recorder.record(baseNotification({ benchmark_id: 'b', sequence: 1 }))).toBeNull();
    expect(
      recorder.record(baseNotification({ benchmark_id: 'b', sent_at_ms: 1_000 })),
    ).toBeNull();
    expect(recorder.samples()).toHaveLength(0);
  });

  it('deduplicates repeats of the same sequence', () => {
    const recorder = createBenchmarkRecorder({ now: () => 1_100 });
    const data = { benchmark_id: 'b1', sequence: 4, sent_at_ms: 1_000 };

    expect(recorder.record(baseNotification(data))).not.toBeNull();
    expect(recorder.record(baseNotification(data))).toBeNull();
    expect(recorder.samples()).toHaveLength(1);
  });

  it('computes min/avg/p50/p95/p99/max correctly', () => {
    let clock = 0;
    const recorder = createBenchmarkRecorder({ now: () => clock });
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    latencies.forEach((latency, index) => {
      clock = 1_000 + latency;
      recorder.record(
        baseNotification({ benchmark_id: 'b1', sequence: index, sent_at_ms: 1_000 }),
      );
    });

    const summary = recorder.summary();

    expect(summary.received).toBe(10);
    expect(summary.min).toBe(10);
    expect(summary.max).toBe(100);
    expect(summary.avg).toBe(55);
    expect(summary.p50).toBeCloseTo(55, 5);
    expect(summary.p95).toBeCloseTo(95.5, 5);
    expect(summary.p99).toBeCloseTo(99.1, 5);
  });

  it('reports lost count when expectedCount is provided', () => {
    let clock = 1_010;
    const recorder = createBenchmarkRecorder({ expectedCount: 5, now: () => clock });

    [0, 1, 3].forEach((sequence) => {
      recorder.record(
        baseNotification({ benchmark_id: 'b1', sequence, sent_at_ms: 1_000 }),
      );
    });

    const summary = recorder.summary();
    expect(summary.received).toBe(3);
    expect(summary.expectedCount).toBe(5);
    expect(summary.lost).toBe(2);
  });

  it('returns zeros and null lost when no samples and no expectedCount', () => {
    const recorder = createBenchmarkRecorder();
    const summary = recorder.summary();

    expect(summary).toMatchObject({
      received: 0,
      expectedCount: null,
      lost: null,
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    });
  });

  it('groups received counts per benchmark id', () => {
    let clock = 1_010;
    const recorder = createBenchmarkRecorder({ now: () => clock });

    recorder.record(baseNotification({ benchmark_id: 'b1', sequence: 0, sent_at_ms: 1_000 }));
    recorder.record(baseNotification({ benchmark_id: 'b1', sequence: 1, sent_at_ms: 1_000 }));
    recorder.record(baseNotification({ benchmark_id: 'b2', sequence: 0, sent_at_ms: 1_000 }));

    expect(recorder.summary().byBenchmark).toEqual({ b1: 2, b2: 1 });
  });

  it('reset clears samples and dedup memory', () => {
    const recorder = createBenchmarkRecorder({ now: () => 1_100 });
    const data = { benchmark_id: 'b1', sequence: 0, sent_at_ms: 1_000 };

    recorder.record(baseNotification(data));
    recorder.reset();

    expect(recorder.samples()).toHaveLength(0);
    expect(recorder.record(baseNotification(data))).not.toBeNull();
  });
});

describe('benchmark recorder + realtime client integration', () => {
  it('does not break the regular notification listener', () => {
    const echo = new FakeEcho();
    const client = createRealtimeClient({ echo, userId: 7 });
    const recorder = createBenchmarkRecorder({ now: () => 1_500 });
    const handler = vi.fn((notification: RealtimeNotification) => {
      recorder.record(notification);
    });

    client.notifications.listen(handler);
    const channel = echo.channels.get('user.7');

    channel?.emit('.pixel.realtime.notification', {
      notification: baseNotification(
        { benchmark_id: 'b1', sequence: 0, sent_at_ms: 1_000 },
        { id: 'b-1' },
      ),
    });

    channel?.emit('.pixel.realtime.notification', {
      notification: baseNotification({ invoice_id: 1 }, { id: 'inv-1', type: 'invoice.created' }),
    });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(recorder.samples()).toHaveLength(1);
    expect(recorder.samples()[0]?.latency_ms).toBe(500);
  });
});
