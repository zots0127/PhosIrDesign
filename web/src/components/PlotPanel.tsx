import { useEffect, useRef } from "react";

interface PlotPanelProps {
  title: string;
  subtitle: string;
  data: Array<Record<string, unknown>>;
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
  onPointClick?: (pointIndex: number) => void;
}

export function PlotPanel({ title, subtitle, data, layout, config, onPointClick }: PlotPanelProps) {
  const plotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const plotNode = plotRef.current as (HTMLDivElement & {
      on?: (eventName: string, handler: (event: { points?: Array<{ pointIndex: number }> }) => void) => void;
      removeAllListeners?: (eventName?: string) => void;
    }) | null;
    if (!plotNode) {
      return;
    }

    let disposed = false;

    import("plotly.js-dist-min").then((module) => {
      if (disposed) {
        return;
      }

      const Plotly = module.default;
      Plotly.newPlot(plotNode, data, layout, {
        displayModeBar: false,
        responsive: true,
        ...config,
      });

      if (onPointClick && plotNode.on) {
        plotNode.on("plotly_click", (event) => {
          if (!disposed && event.points?.[0]) {
            onPointClick(event.points[0].pointIndex);
          }
        });
      }
    });

    return () => {
      disposed = true;
      plotNode.removeAllListeners?.("plotly_click");
      import("plotly.js-dist-min").then((module) => {
        module.default.purge(plotNode);
      });
    };
  }, [config, data, layout, onPointClick]);

  return (
    <section className="panel-card plot-card">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div ref={plotRef} className="plot-surface" />
    </section>
  );
}
