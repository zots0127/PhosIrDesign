import { useEffect, useRef, useState } from "react";

interface MoleculeViewerProps {
  smiles: string;
  label: string;
}

export function MoleculeViewer({ smiles, label }: MoleculeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !smiles) {
      return;
    }

    let cancelled = false;
    setFailed(false);
    import("smiles-drawer")
      .then((module) => {
        if (cancelled) {
          return;
        }
        const SmilesDrawer = module.default;
        const drawer = new SmilesDrawer.Drawer({
          width: 260,
          height: 180,
          compactDrawing: false,
          padding: 18,
        });

        SmilesDrawer.parse(
          smiles,
          (tree: unknown) => {
            if (!cancelled) {
              drawer.draw(tree, canvas, "light", false);
            }
          },
          () => {
            if (!cancelled) {
              setFailed(true);
            }
          },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [smiles]);

  return (
    <div className="molecule-card">
      <div className="molecule-card-header">
        <strong>{label}</strong>
        <span>SMILES</span>
      </div>
      {failed ? <div className="molecule-fallback">Unable to render this ligand in-browser.</div> : <canvas ref={canvasRef} />}
      <code className="smiles-code">{smiles}</code>
    </div>
  );
}
