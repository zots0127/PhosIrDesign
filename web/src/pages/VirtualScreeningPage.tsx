import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { MetricCard } from "../components/MetricCard";
import { PlotPanel } from "../components/PlotPanel";
import { RangeFilterBar } from "../components/RangeFilterBar";
import { SectionIntro } from "../components/SectionIntro";
import { filterVirtualRecords } from "../lib/filters";
import { computeVirtualSummary, formatNumber } from "../lib/normalize";
import { wavelengthColors } from "../lib/wavelengthColor";
import type { VirtualPredictionRecord, VirtualSummaryPayload } from "../types/data";

interface VirtualScreeningPageProps {
  records: VirtualPredictionRecord[];
  summary: VirtualSummaryPayload;
  onSelectRecord: (record: VirtualPredictionRecord) => void;
}

export function VirtualScreeningPage({ records, summary, onSelectRecord }: VirtualScreeningPageProps) {
  const [query, setQuery] = useState("");
  const [minPlqy, setMinPlqy] = useState(0.7);
  const [wavelengthMin, setWavelengthMin] = useState(500);
  const [wavelengthMax, setWavelengthMax] = useState(800);

  const filteredRecords = filterVirtualRecords(records, {
    query,
    minPlqy,
    wavelengthMin,
    wavelengthMax,
  });
  const cards = computeVirtualSummary(records);

  const columns: ColumnDef<VirtualPredictionRecord>[] = [
    { header: "Rank", accessorKey: "rank" },
    {
      header: "Predicted emission",
      accessorKey: "predictedMaxWavelengthNm",
      cell: ({ getValue }) => `${formatNumber(getValue<number | null>(), 1)} nm`,
    },
    {
      header: "Predicted PLQY",
      accessorKey: "predictedPlqy",
      cell: ({ getValue }) => formatNumber(getValue<number | null>(), 3),
    },
    {
      header: "Combined score",
      accessorKey: "combinedScore",
      cell: ({ getValue }) => formatNumber(getValue<number | null>(), 3),
    },
  ];

  return (
    <div className="page-stack">
      <section className="panel-card">
        <SectionIntro
          eyebrow="Virtual-screening explorer"
          title="Browser-friendly focus subset of the ranked screening library"
          description={summary.selectionNote}
        />
      </section>

      <div className="metrics-grid compact">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <RangeFilterBar
        query={query}
        onQueryChange={setQuery}
        minPlqy={minPlqy}
        onMinPlqyChange={setMinPlqy}
        wavelengthMin={wavelengthMin}
        wavelengthMax={wavelengthMax}
        onWavelengthMinChange={setWavelengthMin}
        onWavelengthMaxChange={setWavelengthMax}
      />

      <PlotPanel
        title="Predicted emission versus predicted PLQY"
        subtitle={`${filteredRecords.length.toLocaleString()} focus-set candidates match the current filters`}
        onPointClick={(pointIndex) => {
          const record = filteredRecords[pointIndex];
          if (record) {
            onSelectRecord(record);
          }
        }}
        data={[
          {
            type: "scattergl",
            mode: "markers",
            x: filteredRecords.map((record) => record.predictedMaxWavelengthNm),
            y: filteredRecords.map((record) => record.predictedPlqy),
            text: filteredRecords.map((record) => `#${record.rank}`),
            marker: {
              size: 8,
              color: wavelengthColors(filteredRecords.map((record) => record.predictedMaxWavelengthNm)),
              line: { color: "rgba(23, 50, 77, 0.18)", width: 0.35 },
            },
          },
        ]}
        layout={{
          margin: { t: 24, r: 18, b: 52, l: 54 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "#fbfaf7",
          xaxis: { title: "Predicted max wavelength (nm)" },
          yaxis: { title: "Predicted PLQY" },
        }}
      />

      <DataTable
        title="Ranked virtual candidates"
        description="The table is sortable. Select a row to inspect the ligand set in the detail panel."
        data={filteredRecords}
        columns={columns}
        onRowSelect={onSelectRecord}
      />
    </div>
  );
}
