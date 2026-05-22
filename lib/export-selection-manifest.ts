import type { PlaybookState } from './soar-types';
import { getActionById } from './fortisoar-action-registry';

export interface SelectionManifestItem {
  id: string;
  label: string;
}

export interface ExportSelectionManifest {
  enrichmentConnectors: SelectionManifestItem[];
  responseActions: SelectionManifestItem[];
}

function unique(items: SelectionManifestItem[]): SelectionManifestItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildExportSelectionManifest(playbook: PlaybookState): ExportSelectionManifest {
  const enrichmentConnectors = unique(
    (playbook.enrichmentConnectors ?? []).map((id) => {
      return { id, label: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
    }),
  );

  const responseActions = unique(
    (playbook.actions ?? []).map((id) => {
      const action = getActionById(id);
      return { id, label: action?.displayName ?? id };
    }),
  );

  return { enrichmentConnectors, responseActions };
}

export function renderSelectionManifestMarkdown(manifest: ExportSelectionManifest): string {
  const enrichment = manifest.enrichmentConnectors.length > 0
    ? manifest.enrichmentConnectors.map((c) => `- ${c.label} (\`${c.id}\`)`).join('\n')
    : '- None selected';
  const actions = manifest.responseActions.length > 0
    ? manifest.responseActions.map((a) => `- ${a.label} (\`${a.id}\`)`).join('\n')
    : '- None selected';

  return [
    '## Wizard Selection Manifest',
    '',
    '### Step 4 — Enrichment Connectors',
    enrichment,
    '',
    '### Step 6 — Response Actions',
    actions,
  ].join('\n');
}
