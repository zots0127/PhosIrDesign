import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable";
import { PlotPanel } from "../components/PlotPanel";
import { SectionIntro } from "../components/SectionIntro";
import { filterTrainingRecords } from "../lib/filters";
import { formatNumber, sortSolvents } from "../lib/normalize";
import { wavelengthColors } from "../lib/wavelengthColor";
import type { TrainingRecord } from "../types/data";

interface DatasetExplorerPageProps {
  records: TrainingRecord[];
  onSelectRecord: (record: TrainingRecord) => void;
}

export function DatasetExplorerPage({ records, onSelectRecord }: DatasetExplorerPageProps) {
  const [query, setQuery] = useState("");
  const [solvent, setSolvent] = useState("All");

  const solvents = sortSolvents(records);
  const filteredRecords = filterTrainingRecords(records, { query, solvent });

  const columns: ColumnDef<TrainingRecord>[] = [
    { header: "Label", accessorKey: "label" },
    {
      header: "Emission (nm)",
      accessorKey: "maxWavelengthNm",
      cell: ({ getValue }) => `${formatNumber(getValue<number | null>(), 1)} nm`,
    },
    {
      header: "PLQY",
      accessorKey: "plqy",
      cell: ({ getValue }) => formatNumber(getValue<number | null>(), 3),
    },
    { header: "Solvent", accessorKey: "solvent" },
  ];

  return (
    <div className="page-stack">
      <section className="panel-card">
        <SectionIntro
          eyebrow="Dataset explorer"
          title="Curated Ir(III) training set"
          description="Search by label or ligand SMILES, filter by solvent, and inspect the wavelength-PLQY distribution used for supervised model training."
        />
        <div className="filters-grid compact">
          <label>
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Label or ligand SMILES" />
          </label>
          <label>
            Solvent
            <select value={solvent} onChange={(event) => setSolvent(event.target.value)}>
              <option value="All">All</option>
              {solvents.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <PlotPanel
        title="Observed emission versus PLQY"
        subtitle={`${filteredRecords.length.toLocaleString()} records after filtering`}
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
            x: filteredRecords.map((record) => record.maxWavelengthNm),
            y: filteredRecords.map((record) => record.plqy),
            text: filteredRecords.map((record) => record.label ?? record.id),
            marker: {
              size: 9,
              color: wavelengthColors(filteredRecords.map((record) => record.maxWavelengthNm)),
              line: { color: "rgba(23, 50, 77, 0.2)", width: 0.5 },
            },
          },
        ]}
        layout={{
          margin: { t: 24, r: 18, b: 52, l: 54 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "#fbfaf7",
          xaxis: { title: "Observed max wavelength (nm)" },
          yaxis: { title: "PLQY" },
        }}
      />

      <DataTable
        title="Training records"
        description="Rows are sortable. Click one to open the ligand structures and metadata in the detail panel."
        data={filteredRecords}
        columns={columns}
        onRowSelect={onSelectRecord}
      />
    </div>
  );
}
