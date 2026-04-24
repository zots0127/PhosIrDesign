interface RangeFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  minPlqy: number;
  onMinPlqyChange: (value: number) => void;
  wavelengthMin: number;
  wavelengthMax: number;
  onWavelengthMinChange: (value: number) => void;
  onWavelengthMaxChange: (value: number) => void;
}

export function RangeFilterBar({
  query,
  onQueryChange,
  minPlqy,
  onMinPlqyChange,
  wavelengthMin,
  wavelengthMax,
  onWavelengthMinChange,
  onWavelengthMaxChange,
}: RangeFilterBarProps) {
  return (
    <section className="panel-card filters-card">
      <div className="panel-header">
        <div>
          <h3>Filters</h3>
          <p>Restrict the focus subset by text, PLQY floor, and emission window.</p>
        </div>
      </div>
      <div className="filters-grid">
        <label>
          Search
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ligand, ID, or SMILES" />
        </label>
        <label>
          Minimum predicted PLQY
          <input
            type="number"
            min="0"
            max="1.2"
            step="0.01"
            value={minPlqy}
            onChange={(event) => onMinPlqyChange(Number(event.target.value))}
          />
        </label>
        <label>
          Wavelength min (nm)
          <input
            type="number"
            min="300"
            max="1000"
            step="1"
            value={wavelengthMin}
            onChange={(event) => onWavelengthMinChange(Number(event.target.value))}
          />
        </label>
        <label>
          Wavelength max (nm)
          <input
            type="number"
            min="300"
            max="1000"
            step="1"
            value={wavelengthMax}
            onChange={(event) => onWavelengthMaxChange(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
