import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
  renderTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Measure page load time
    const loadTime =
      performance.timing.loadEventEnd - performance.timing.navigationStart;
    setMetrics((prev) => ({ ...prev, loadTime }));

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics((prev) => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Memory monitoring (Chrome only)
    let memoryInterval: NodeJS.Timeout | null = null;
    if ('memory' in performance) {
      const measureMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          setMetrics((prev) => ({
            ...prev,
            memory: Math.round(memory.usedJSHeapSize / 1048576) // Convert to MB
          }));
        }
      };

      memoryInterval = setInterval(measureMemory, 1000);
    }

    return () => {
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }
    };
  }, []);

  // Measure render time
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      setMetrics((prev) => ({
        ...prev,
        renderTime: Math.round(end - start)
      }));
    };
  });

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible || (import.meta as any).env?.DEV) {
    return null;
  }

  return (
    <div className="performance-monitor">
      <div className="performance-metrics">
        <div className="metric">
          <span className="metric-label">FPS:</span>
          <span className="metric-value">{metrics.fps}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Memory:</span>
          <span className="metric-value">{metrics.memory} MB</span>
        </div>
        <div className="metric">
          <span className="metric-label">Load Time:</span>
          <span className="metric-value">{metrics.loadTime} ms</span>
        </div>
        <div className="metric">
          <span className="metric-label">Render Time:</span>
          <span className="metric-value">{metrics.renderTime} ms</span>
        </div>
      </div>
    </div>
  );
};
