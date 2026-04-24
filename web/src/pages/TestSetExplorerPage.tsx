import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { MetricCard } from "../components/MetricCard";
import { PlotPanel } from "../components/PlotPanel";
import { SectionIntro } from "../components/SectionIntro";
import { filterTestRecords } from "../lib/filters";
import { computeTestSummary, formatNumber } from "../lib/normalize";
import { wavelengthColors } from "../lib/wavelengthColor";
import type { TestPredictionRecord } from "../types/data";

interface TestSetExplorerPageProps {
  records: TestPredictionRecord[];
  onSelectRecord: (record: TestPredictionRecord) => void;
}

export function TestSetExplorerPage({ records, onSelectRecord }: TestSetExplorerPageProps) {
  const [query, setQuery] = useState("");
  const filteredRecords = filterTestRecords(records, query);
  const summaryCards = computeTestSummary(records);

  const columns: ColumnDef<TestPredictionRecord>[] = [
    { header: "Compound", accessorKey: "displayName" },
    {
      header: "Actual emission",
      accessorKey: "actualMaxWavelengthNm",
      cell: ({ getValue }) => `${formatNumber(getValue<number | null>(), 1)} nm`,
    },
    {
      header: "Predicted emission",
      accessorKey: "predictedMaxWavelengthNm",
      cell: ({ getValue }) => `${formatNumber(getValue<number | null>(), 1)} nm`,
    },
    {
      header: "Actual PLQY",
      accessorKey: "actualPlqy",
      cell: ({ getValue }) => formatNumber(getValue<number | null>(), 3),
    },
    {
      header: "Predicted PLQY",
      accessorKey: "predictedPlqy",
      cell: ({ getValue }) => formatNumber(getValue<number | null>(), 3),
    },
  ];

  return (
    <div className="page-stack">
      <section className="panel-card">
        <SectionIntro
          eyebrow="Test-set explorer"
          title="Shipped xgboost post-screening prediction export"
          description="These values are generated from the shipped model export for experimentally measured emitters synthesized after virtual screening."
        />
        <div className="filters-grid compact">
          <label>
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ir1, Ir1b, or ligand SMILES" />
          </label>
        </div>
      </section>

      <div className="metrics-grid compact">
        {summaryCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <PlotPanel
        title="Predicted emission versus predicted PLQY"
        subtitle="Click any test molecule to inspect the shipped ligands and prediction deltas."
        onPointClick={(pointIndex) => {
          const record = filteredRecords[pointIndex];
          if (record) {
            onSelectRecord(record);
          }
        }}
        data={[
          {
            type: "scatter",
            mode: "markers+text",
            x: filteredRecords.map((record) => record.predictedMaxWavelengthNm),
            y: filteredRecords.map((record) => record.predictedPlqy),
            text: filteredRecords.map((record) => record.displayName),
            textposition: "top center",
            marker: {
              size: 14,
              color: wavelengthColors(filteredRecords.map((record) => record.predictedMaxWavelengthNm)),
              line: { color: "rgba(23, 50, 77, 0.28)", width: 0.75 },
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
        title="External test-set predictions"
        description="Actual and predicted targets are shown side-by-side for the shipped xgboost export."
        data={filteredRecords}
        columns={columns}
        onRowSelect={onSelectRecord}
      />
    </div>
  );
}
