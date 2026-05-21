'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AeoLeadRow } from '@/lib/supabase'

const INDUSTRIES = [
  'Financial services',
  'Healthcare',
  'Professional services',
  'Public sector',
  'Technology',
  'Other',
]

interface Props {
  lead: AeoLeadRow
  competitorList: string[]
}

interface FormState {
  first_name: string
  email: string
  website: string
  company_name: string
  occupation: string
  industry: string
  competitor_1: string
  competitor_2: string
  competitor_3: string
  notes: string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function RequestForm({ lead, competitorList }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    first_name:   lead.first_name ?? '',
    email:        lead.email ?? '',
    website:      lead.website ?? '',
    company_name: lead.company_name ?? '',
    occupation:   lead.occupation ?? '',
    industry:     lead.industry ?? '',
    competitor_1: competitorList[0] ?? '',
    competitor_2: competitorList[1] ?? '',
    competitor_3: competitorList[2] ?? '',
    notes:        [lead.target_queries, lead.positioning]
                    .filter(Boolean).join('\n').trim(),
  })

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function touch(field: keyof FormState) {
    setTouched(t => ({ ...t, [field]: true }))
  }

  function isValidUrl(value: string): boolean {
    if (!value) return true
    try { new URL(value.startsWith('http') ? value : `https://${value}`); return true }
    catch { return false }
  }

  const required: (keyof FormState)[] = ['first_name', 'email', 'company_name', 'occupation', 'industry']
  const urlFields: (keyof FormState)[] = ['website', 'competitor_1', 'competitor_2', 'competitor_3']

  function fieldError(field: keyof FormState): string | null {
    if (!touched[field]) return null
    if (required.includes(field) && !form[field].trim()) return 'Required'
    if (field === 'email' && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Enter a valid email'
    if (urlFields.includes(field) && form[field] && !isValidUrl(form[field]))
      return 'Enter a valid URL'
    return null
  }

  function validate(): boolean {
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof FormState)[]).map(k => [k, true])
    ) as Record<keyof FormState, boolean>
    setTouched(allTouched)
    for (const f of required) {
      if (!form[f].trim()) return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false
    for (const f of urlFields) {
      if (form[f] && !isValidUrl(form[f])) return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setError(null)
    const payload = {
      ...form,
      lead_id:        lead.id,
      company_slug:   slugify(form.company_name),
      plan_steps:     lead.plan_steps ?? [],
      plan_quick_win: lead.plan_quick_win ?? '',
      platform:       lead.platform,
      challenge:      lead.challenge,
      outcome:        lead.outcome,
    }
    try {
      const res = await fetch('/api/request-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }
      router.push(`/report/success?email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.first_name)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div className="bg-white rounded-xl border border-[#042C53]/10 p-5">
        <p className="text-xs font-semibold text-[#042C53]/50 uppercase tracking-wide mb-4">Your details</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required value={form.first_name} error={fieldError('first_name')}
            onChange={v => set('first_name', v)} onBlur={() => touch('first_name')} />
          <Field label="Email" type="email" required value={form.email} error={fieldError('email')}
            onChange={v => set('email', v)} onBlur={() => touch('email')} />
        </div>
        <div className="mt-4">
          <Field label="Website" type="url" placeholder="https://yoursite.com"
            value={form.website} error={fieldError('website')}
            onChange={v => set('website', v)} onBlur={() => touch('website')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#042C53]/10 p-5">
        <p className="text-xs font-semibold text-[#042C53]/50 uppercase tracking-wide mb-4">About your company</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company name" required value={form.company_name} error={fieldError('company_name')}
            onChange={v => set('company_name', v)} onBlur={() => touch('company_name')} />
          <Field label="Your role / title" required value={form.occupation} error={fieldError('occupation')}
            onChange={v => set('occupation', v)} onBlur={() => touch('occupation')} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#042C53] mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <select value={form.industry} onChange={e => set('industry', e.target.value)}
            onBlur={() => touch('industry')}
            className={`w-full px-3 py-2 rounded-lg border text-sm text-[#042C53] bg-white
              focus:outline-none focus:ring-2 focus:ring-[#BA7517]/40
              ${fieldError('industry') ? 'border-red-400' : 'border-[#042C53]/20'}`}>
            <option value="">Select industry…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {fieldError('industry') && <p className="text-red-500 text-xs mt-1">{fieldError('industry')}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#042C53]/10 p-5">
        <p className="text-xs font-semibold text-[#042C53]/50 uppercase tracking-wide mb-1">Competitors to benchmark</p>
        <p className="text-xs text-[#042C53]/50 mb-4">Up to 3. We'll show how often AI mentions them vs you.</p>
        <div className="space-y-3">
          {(['competitor_1', 'competitor_2', 'competitor_3'] as const).map((f, i) => (
            <Field key={f} label={`Competitor ${i + 1} website`} type="url"
              placeholder="https://competitor.com" value={form[f]} error={fieldError(f)}
              onChange={v => set(f, v)} onBlur={() => touch(f)} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#042C53]/10 p-5">
        <label className="block text-sm font-medium text-[#042C53] mb-1">
          Anything specific you want the report to address?
        </label>
        <p className="text-xs text-[#042C53]/50 mb-2">Optional</p>
        <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Target queries, specific competitors, markets you want to rank in…"
          className="w-full px-3 py-2 rounded-lg border border-[#042C53]/20 text-sm text-[#042C53]
            focus:outline-none focus:ring-2 focus:ring-[#BA7517]/40 resize-none" />
      </div>

      <p className="text-xs text-[#042C53]/50 text-center">
        After you submit, a Maxifi analyst runs your full cross-LLM analysis across
        ChatGPT, Claude, Gemini, Perplexity and Copilot. Your board-ready report is
        delivered within 5 business days.
      </p>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3.5 px-6 bg-[#BA7517] hover:bg-[#9a6012] disabled:opacity-60
          text-white font-semibold rounded-xl transition-colors text-base">
        {submitting ? 'Submitting…' : 'Request full report →'}
      </button>

    </form>
  )
}

interface FieldProps {
  label: string; value: string; onChange: (v: string) => void
  onBlur?: () => void; error?: string | null; type?: string
  placeholder?: string; required?: boolean
}

function Field({ label, value, onChange, onBlur, error, type = 'text', placeholder, required }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#042C53] mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-[#042C53]
          focus:outline-none focus:ring-2 focus:ring-[#BA7517]/40
          ${error ? 'border-red-400' : 'border-[#042C53]/20'}`} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
