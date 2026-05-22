import type { PlaybookState } from './soar-types';
import { getActionById } from './fortisoar-action-registry';

export interface SelectionManifestItem {
  id: string;
  label: string;
}

export interface ExportSelectionManifest {
  enrichmentConnectors: SelectionManifestItem[];
  responseActions: SelectionManifestItem[];
  requiredConnectorKeys: string[];
  sourceStepMapping: {
    enrichmentConnectors: 'Step 4';
    responseActions: 'Step 6';
    requiredConnectorKeys: 'Step 4 + Step 6 + Template';
  };
  generatedWorkflowCoverage: {
    supportedActions: SelectionManifestItem[];
    unsupportedActions: SelectionManifestItem[];
  };
}

function unique(items: SelectionManifestItem[]): SelectionManifestItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildExportSelectionManifest(
  playbook: PlaybookState,
  requiredConnectorKeys: string[],
  supportedActionIds: string[],
): ExportSelectionManifest {
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

  const supportedActionIdSet = new Set(supportedActionIds);
  const supportedActions = responseActions.filter((a) => supportedActionIdSet.has(a.id));
  const unsupportedActions = responseActions.filter((a) => !supportedActionIdSet.has(a.id));

  return {
    enrichmentConnectors,
    responseActions,
    requiredConnectorKeys: Array.from(new Set(requiredConnectorKeys)),
    sourceStepMapping: {
      enrichmentConnectors: 'Step 4',
      responseActions: 'Step 6',
      requiredConnectorKeys: 'Step 4 + Step 6 + Template',
    },
    generatedWorkflowCoverage: {
      supportedActions,
      unsupportedActions,
    },
  };
}

export function renderSelectionManifestMarkdown(manifest: ExportSelectionManifest): string {
  const enrichment = manifest.enrichmentConnectors.length > 0
    ? manifest.enrichmentConnectors.map((c) => `- ${c.label} (\`${c.id}\`)`).join('\n')
    : '- None selected';
  const actions = manifest.responseActions.length > 0
    ? manifest.responseActions.map((a) => `- ${a.label} (\`${a.id}\`)`).join('\n')
    : '- None selected';

  const requiredConnectorKeys = manifest.requiredConnectorKeys.length > 0
    ? manifest.requiredConnectorKeys.map((k) => `- \`${k}\``).join('\n')
    : '- None resolved';
  const supportedActions = manifest.generatedWorkflowCoverage.supportedActions.length > 0
    ? manifest.generatedWorkflowCoverage.supportedActions.map((a) => `- ${a.label} (\`${a.id}\`)`).join('\n')
    : '- None';
  const unsupportedActions = manifest.generatedWorkflowCoverage.unsupportedActions.length > 0
    ? manifest.generatedWorkflowCoverage.unsupportedActions.map((a) => `- ${a.label} (\`${a.id}\`)`).join('\n')
    : '- None';

  return [
    '## Wizard Selection Manifest',
    '',
    '### Step 4 — Enrichment Connectors',
    enrichment,
    '',
    '### Step 6 — Response Actions',
    actions,
    '',
    '### Required Connector Keys',
    requiredConnectorKeys,
    '',
    '### Source Step Mapping',
    '- Enrichment Connectors: Step 4',
    '- Response Actions: Step 6',
    '- Required Connector Keys: Step 4 + Step 6 + Template',
    '',
    '### Generated Workflow Coverage',
    '#### Supported Actions (generated as workflow nodes where supported)',
    supportedActions,
    '',
    '#### Unsupported Actions (documented; manual implementation may be needed)',
    unsupportedActions,
  ].join('\n');
}
