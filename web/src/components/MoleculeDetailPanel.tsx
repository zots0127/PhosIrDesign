import type { SelectableRecord } from "../types/data";
import { collectLigands, formatNumber, buildMoleculeTitle } from "../lib/normalize";
import { MoleculeViewer } from "./MoleculeViewer";

interface MoleculeDetailPanelProps {
  record: SelectableRecord | null;
  onClear: () => void;
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="property-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MoleculeDetailPanel({ record, onClear }: MoleculeDetailPanelProps) {
  if (!record) {
    return (
      <section className="detail-panel empty">
        <p className="eyebrow">Molecule detail</p>
        <h3>Select a row or chart point</h3>
        <p>The detail panel will show the ligand set, structure renderings, and record-level metrics.</p>
      </section>
    );
  }

  const ligands = collectLigands(record);

  return (
    <section className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <p className="eyebrow">Molecule detail</p>
          <h3>{buildMoleculeTitle(record)}</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="detail-properties">
        {"label" in record && <PropertyRow label="Training label" value={record.label ?? "N/A"} />}
        {"displayName" in record && <PropertyRow label="Export label" value={record.displayName} />}
        {"rank" in record && <PropertyRow label="Virtual rank" value={`#${record.rank}`} />}
        {"maxWavelengthNm" in record && (
          <PropertyRow label="Observed emission" value={`${formatNumber(record.maxWavelengthNm, 1)} nm`} />
        )}
        {"plqy" in record && <PropertyRow label="Observed PLQY" value={formatNumber(record.plqy, 3)} />}
        {"predictedMaxWavelengthNm" in record && (
          <PropertyRow label="Predicted emission" value={`${formatNumber(record.predictedMaxWavelengthNm, 1)} nm`} />
        )}
        {"predictedPlqy" in record && <PropertyRow label="Predicted PLQY" value={formatNumber(record.predictedPlqy, 3)} />}
        {"solvent" in record && <PropertyRow label="Solvent" value={record.solvent ?? "N/A"} />}
      </div>
      <div className="molecule-stack">
        {ligands.map((ligand) => (
          <MoleculeViewer key={`${record.id}-${ligand.label}`} label={ligand.label} smiles={ligand.smiles} />
        ))}
      </div>
    </section>
  );
}
