import type { RealtimeNotification } from './types';

export type BenchmarkSample = {
  benchmark_id: string;
  sequence: number;
  sent_at_ms: number;
  received_at_ms: number;
  latency_ms: number;
};

export type BenchmarkSummary = {
  received: number;
  expectedCount: number | null;
  lost: number | null;
  min: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  byBenchmark: Record<string, number>;
};

export type BenchmarkRecorderOptions = {
  expectedCount?: number;
  now?: () => number;
};

export type BenchmarkRecorder = {
  record: (notification: RealtimeNotification) => BenchmarkSample | null;
  samples: () => BenchmarkSample[];
  summary: () => BenchmarkSummary;
  reset: () => void;
};

export function createBenchmarkRecorder(options: BenchmarkRecorderOptions = {}): BenchmarkRecorder {
  const now = options.now ?? (() => Date.now());
  const expectedCount = options.expectedCount ?? null;
  let samples: BenchmarkSample[] = [];
  const seenSequences = new Map<string, Set<number>>();

  return {
    record(notification) {
      const data = notification.data as Record<string, unknown> | undefined;

      if (!data) {
        return null;
      }

      const benchmarkId = typeof data.benchmark_id === 'string' ? data.benchmark_id : null;
      const sequence = typeof data.sequence === 'number' ? data.sequence : null;
      const sentAtMs = typeof data.sent_at_ms === 'number' ? data.sent_at_ms : null;

      if (benchmarkId === null || sequence === null || sentAtMs === null) {
        return null;
      }

      const seen = seenSequences.get(benchmarkId) ?? new Set<number>();
      if (seen.has(sequence)) {
        return null;
      }
      seen.add(sequence);
      seenSequences.set(benchmarkId, seen);

      const receivedAtMs = now();
      const sample: BenchmarkSample = {
        benchmark_id: benchmarkId,
        sequence,
        sent_at_ms: sentAtMs,
        received_at_ms: receivedAtMs,
        latency_ms: receivedAtMs - sentAtMs,
      };

      samples.push(sample);
      return sample;
    },
    samples() {
      return [...samples];
    },
    summary() {
      const latencies = samples.map((sample) => sample.latency_ms);
      const sorted = [...latencies].sort((a, b) => a - b);
      const received = samples.length;

      const byBenchmark: Record<string, number> = {};
      for (const sample of samples) {
        byBenchmark[sample.benchmark_id] = (byBenchmark[sample.benchmark_id] ?? 0) + 1;
      }

      return {
        received,
        expectedCount,
        lost: expectedCount !== null ? Math.max(expectedCount - received, 0) : null,
        min: sorted[0] ?? 0,
        avg: received > 0 ? latencies.reduce((sum, value) => sum + value, 0) / received : 0,
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        max: sorted[sorted.length - 1] ?? 0,
        byBenchmark,
      };
    },
    reset() {
      samples = [];
      seenSequences.clear();
    },
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? lowerValue;

  if (lower === upper) {
    return lowerValue;
  }

  const weight = rank - lower;
  return lowerValue * (1 - weight) + upperValue * weight;
}
