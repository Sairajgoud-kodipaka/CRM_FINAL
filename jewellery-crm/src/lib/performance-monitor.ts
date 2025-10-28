interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  slowestResponseTime: number;
  totalResponseTime: number;
}

interface EndpointMetrics {
  count: number;
  totalTime: number;
  averageTime: number;
  slowestTime: number;
  lastCall: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    slowestEndpoint: '',
    slowestResponseTime: 0,
    totalResponseTime: 0,
  };

  private endpointMetrics = new Map<string, EndpointMetrics>();
  private startTimes = new Map<string, number>();

  // Start timing an API call
  startTiming(endpoint: string): void {
    this.startTimes.set(endpoint, performance.now());
  }

  // End timing and record metrics
  endTiming(endpoint: string, wasCached: boolean = false): void {
    const startTime = this.startTimes.get(endpoint);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.startTimes.delete(endpoint);

    // Update global metrics
    this.metrics.apiCalls++;
    this.metrics.totalResponseTime += duration;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.apiCalls;

    if (wasCached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update slowest endpoint tracking
    if (duration > this.metrics.slowestResponseTime) {
      this.metrics.slowestResponseTime = duration;
      this.metrics.slowestEndpoint = endpoint;
    }

    // Update endpoint-specific metrics
    const existing = this.endpointMetrics.get(endpoint) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      slowestTime: 0,
      lastCall: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.averageTime = existing.totalTime / existing.count;
    existing.slowestTime = Math.max(existing.slowestTime, duration);
    existing.lastCall = Date.now();

    this.endpointMetrics.set(endpoint, existing);

    // Log slow API calls
    if (duration > 1000) {

    }
  }

  // Record cache hit
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  // Record cache miss
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get endpoint-specific metrics
  getEndpointMetrics(endpoint: string): EndpointMetrics | undefined {
    return this.endpointMetrics.get(endpoint);
  }

  // Get all endpoint metrics
  getAllEndpointMetrics(): Map<string, EndpointMetrics> {
    return new Map(this.endpointMetrics);
  }

  // Get cache hit rate
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      slowestEndpoint: '',
      slowestResponseTime: 0,
      totalResponseTime: 0,
    };
    this.endpointMetrics.clear();
    this.startTimes.clear();
  }

  // Generate performance report
  generateReport(): string {
    const cacheHitRate = this.getCacheHitRate();
    const report = `
🚀 Performance Report
====================
📊 API Calls: ${this.metrics.apiCalls}
⚡ Cache Hits: ${this.metrics.cacheHits}
❌ Cache Misses: ${this.metrics.cacheMisses}
🎯 Cache Hit Rate: ${cacheHitRate.toFixed(2)}%
⏱️ Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms
🐌 Slowest Endpoint: ${this.metrics.slowestEndpoint} (${this.metrics.slowestResponseTime.toFixed(2)}ms)
    `;

    return report;
  }

  // Log performance summary to console
  logSummary(): void {

  }

  // Export metrics for external monitoring
  exportMetrics(): object {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      endpoints: Object.fromEntries(this.getAllEndpointMetrics()),
      cacheHitRate: this.getCacheHitRate(),
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorator for API methods
export function monitorPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const endpoint = args[0] || 'unknown';
    performanceMonitor.startTiming(endpoint);

    try {
      const result = await method.apply(this, args);
      performanceMonitor.endTiming(endpoint, false);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(endpoint, false);
      throw error;
    }
  };

  return descriptor;
}

// Utility function to measure function execution time
export function measureExecutionTime<T>(fn: () => T | Promise<T>, label: string): T | Promise<T> {
  const start = performance.now();

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;

      });
    } else {
      const duration = performance.now() - start;

      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;

    throw error;
  }
}

export default PerformanceMonitor;
