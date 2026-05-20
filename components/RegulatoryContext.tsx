'use client';

import { FormData } from '@/lib/types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}

// Industry family to sector mapping
const REGULATED_SECTORS = new Set([
  'Defense & Government Systems',
  'Defense',
  'Aviation, ATC & Aerospace',
  'Aviation & Aerospace',
  'Healthcare & Life Sciences',
  'Healthcare Technology / Digital Health',
  'Pharmaceuticals & Biotech',
  'Financial Services & Banking',
  'Insurance',
  'Legal & Legal Services',
  'Legal',
]);

const DEFENSE_CERTIFICATIONS = [
  'ITAR',
  'EAR',
  'CMMC',
  'Common Criteria',
  'MIL-STD',
  'Other',
];

const HEALTHCARE_CERTIFICATIONS = [
  'HIPAA',
  'MHRA Approved',
  'FDA Cleared',
  'FDA 510(k)',
  'ISO 13485',
  'Other',
];

const FINANCE_CERTIFICATIONS = [
  'FCA Licensed',
  'PRA Regulated',
  'SOC 2',
  'PCI-DSS',
  'ISO 27001',
  'Other',
];

const AVIATION_CERTIFICATIONS = [
  'DO-178C',
  'DO-254',
  'EASA Certified',
  'FAA Certified',
  'ICAO Compliant',
  'Other',
];

const EXPORT_STATUS_OPTIONS = [
  'Subject to ITAR / EAR restrictions',
  'No export restrictions',
  'Encrypted / anonymized data only',
  'Restricted to specific regions',
  'Unknown',
];

const DATA_RESIDENCY_OPTIONS = [
  'EU-only (GDPR)',
  'US-only (HIPAA)',
  'Global with DPA agreements',
  'Region-specific requirements',
  'Not data-handling relevant',
];

function getSectorCertifications(industry: string): string[] | null {
  if (['Defense & Government Systems', 'Defense'].includes(industry)) {
    return DEFENSE_CERTIFICATIONS;
  }
  if (['Aviation, ATC & Aerospace', 'Aviation & Aerospace'].includes(industry)) {
    return AVIATION_CERTIFICATIONS;
  }
  if (['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech'].includes(industry)) {
    return HEALTHCARE_CERTIFICATIONS;
  }
  if (['Financial Services & Banking', 'Insurance'].includes(industry)) {
    return FINANCE_CERTIFICATIONS;
  }
  if (['Legal & Legal Services', 'Legal'].includes(industry)) {
    return null; // Legal doesn't have specific cert list
  }
  return null;
}

function getCertificationsKey(industry: string): keyof FormData | null {
  if (['Defense & Government Systems', 'Defense'].includes(industry)) {
    return 'defenseCertifications';
  }
  if (['Aviation, ATC & Aerospace', 'Aviation & Aerospace'].includes(industry)) {
    return 'aviationCertifications';
  }
  if (['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Pharmaceuticals & Biotech'].includes(industry)) {
    return 'healthcareCertifications';
  }
  if (['Financial Services & Banking', 'Insurance'].includes(industry)) {
    return 'financeCertifications';
  }
  return null;
}

export default function RegulatoryContext({ data, onChange }: Props) {
  if (!REGULATED_SECTORS.has(data.industry)) {
    return null;
  }

  const certKey = getCertificationsKey(data.industry);
  const certifications = certKey ? (data[certKey] as string[] | undefined) ?? [] : [];
  const sectorCerts = getSectorCertifications(data.industry);

  const toggleCertification = (cert: string) => {
    if (!certKey) return;
    const current = certifications as string[];
    if (current.includes(cert)) {
      onChange({ [certKey]: current.filter((c) => c !== cert) });
    } else {
      onChange({ [certKey]: [...current, cert] });
    }
  };

  return (
    <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg px-4 py-4">
      <h2 className="text-[17px] text-gray-800 font-medium mb-3">
        Compliance & Regulatory Context
      </h2>

      <p className="text-xs text-gray-600 mb-4">
        Helps us tailor recommendations to your regulatory constraints and compliance posture.
      </p>

      {/* Certifications */}
      {sectorCerts && (
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Which certifications do you have? <span className="text-gray-400">(optional)</span>
          </label>
          <div className="space-y-1.5">
            {sectorCerts.map((cert) => (
              <label key={cert} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(certifications as string[]).includes(cert)}
                  onChange={() => toggleCertification(cert)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{cert}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Export Status */}
      {['Defense & Government Systems', 'Defense', 'Aviation, ATC & Aerospace', 'Aviation & Aerospace'].includes(data.industry) && (
        <div className="mb-5">
          <label htmlFor="export-status" className="block text-xs font-medium text-gray-700 mb-2">
            Export control status <span className="text-gray-400">(optional)</span>
          </label>
          <select
            id="export-status"
            value={data.exportStatus ?? ''}
            onChange={(e) => onChange({ exportStatus: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">Select status…</option>
            {EXPORT_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Guides AEO strategy around content visibility and distribution constraints.
          </p>
        </div>
      )}

      {/* Data Residency */}
      {['Healthcare & Life Sciences', 'Healthcare Technology / Digital Health', 'Financial Services & Banking', 'Insurance'].includes(data.industry) && (
        <div>
          <label htmlFor="data-residency" className="block text-xs font-medium text-gray-700 mb-2">
            Data residency requirements <span className="text-gray-400">(optional)</span>
          </label>
          <select
            id="data-residency"
            value={data.dataResidency ?? ''}
            onChange={(e) => onChange({ dataResidency: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">Select requirement…</option>
            {DATA_RESIDENCY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Influences recommendations around data handling, platforms, and geographic visibility.
          </p>
        </div>
      )}
    </div>
  );
}
