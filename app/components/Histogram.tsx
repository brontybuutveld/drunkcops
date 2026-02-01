import { useMemo, useRef, useState, useLayoutEffect } from "react";
import * as d3 from "d3";

export function Histogram({
  data,
  width = "600px",
  height = "380px",
  bins = 20,
  title = "",
  xAxis = "",
  yAxis = ""
}: HistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = Math.max(0, size.width - margin.left - margin.right);
  const innerHeight = Math.max(0, size.height - margin.top - margin.bottom);

  const histogram = useMemo(() => {
    if (!innerWidth || !innerHeight) return null;

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data) as [number, number])
      .nice()
      .range([0, innerWidth]);

    const binsData = d3
      .bin()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(bins))(data);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(binsData, d => d.length) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    return { x, y, binsData };
  }, [data, bins, innerWidth, innerHeight]);

  return (
    <>
      {title && (
        <div style={{ textAlign: "center" }}>
          <p>{title}</p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width, height, display: "flex", alignItems: "center" }}
      >
        {yAxis && <p style={{ writingMode: "sideways-lr" }}>{yAxis}</p>}

        <svg width={size.width} height={size.height}>
          {histogram && (
            <g transform={`translate(${margin.left},${margin.top})`}>
              {histogram.binsData.map((bin, i) => (
                <rect
                  key={i}
                  x={histogram.x(bin.x0!)}
                  y={histogram.y(bin.length)}
                  width={Math.max(
                    0,
                    histogram.x(bin.x1!) - histogram.x(bin.x0!) - 1
                  )}
                  height={innerHeight - histogram.y(bin.length)}
                  fill="steelblue"
                />
              ))}

              <g
                transform={`translate(0,${innerHeight})`}
                ref={node => node && d3.select(node).call(d3.axisBottom(histogram.x))}
              />

              <g
                ref={node => node && d3.select(node).call(d3.axisLeft(histogram.y))}
              />
            </g>
          )}
        </svg>
      </div>

      {xAxis && (
        <div style={{ textAlign: "center" }}>
          <p>{xAxis}</p>
        </div>
      )}
    </>
  );
}