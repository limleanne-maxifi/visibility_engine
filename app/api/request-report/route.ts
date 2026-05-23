import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import type { PlanStep } from '@/lib/planTypes'

interface RequestReportPayload {
  lead_id: string; first_name: string; email: string; website: string
  company_name: string; company_slug: string; occupation: string; industry: string
  competitor_1: string; competitor_2: string; competitor_3: string; notes: string
  platform: string; challenge: string; outcome: string
  plan_steps: PlanStep[]; plan_quick_win: string
}

export async function POST(req: NextRequest) {
  let payload: RequestReportPayload
  try { payload = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const required = ['first_name', 'email', 'company_name', 'occupation', 'industry'] as const
  for (const field of required) {
    if (!payload[field]?.trim())
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })

  const competitors = [payload.competitor_1, payload.competitor_2, payload.competitor_3].filter(Boolean)
  const topPriorities = (payload.plan_steps ?? []).slice(0, 3).map(s => `  • ${s.title}`)

  const cliCommand = [
    'PYTHONPATH=src python -m visibility_engine.run \\',
    `  --slug ${payload.company_slug} \\`,
    `  --url ${payload.website || '(add website)'} \\`,
    `  --email ${payload.email}`,
    competitors.length
      ? `\n# Competitors:\n${competitors.map(c => `#   ${c}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n')

  const operatorBody = `
New AI Visibility Report request received.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     ${payload.first_name}
Email:    ${payload.email}
Company:  ${payload.company_name}
Role:     ${payload.occupation}
Industry: ${payload.industry}
Website:  ${payload.website || '(not provided)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Competitors: ${competitors.length ? competitors.join(', ') : 'None'}
Platform:    ${payload.platform}
Challenge:   ${payload.challenge}
Notes:       ${payload.notes || '(none)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP PRIORITIES (from snapshot)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topPriorities.length ? topPriorities.join('\n') : '(none)'}
${payload.plan_quick_win ? `Quick win: ${payload.plan_quick_win}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLI COMMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cliCommand}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Send invoice to ${payload.email} for SGD 2,500
2. On receipt, run the CLI command above
3. QC the PDF — all 5 LLMs present, exec summary tailored to ${payload.occupation}
4. Email report with delivery template (FULFILMENT.md)
5. Mark delivered in Notion

Lead ID: ${payload.lead_id}`.trim()

  const buyerBody = `Hi ${payload.first_name},

We've received your request for a full AI Visibility Report for ${payload.company_name}.

Here's what happens next:

1. We'll send you an invoice for SGD 2,500 within 24 hours
2. Once payment is received, a Maxifi analyst runs your full cross-LLM analysis
3. We benchmark you against your competitors across ChatGPT, Claude, Gemini, Perplexity and Copilot
4. Your board-ready report is delivered to this email within 5 business days

Your report will specifically address:
${topPriorities.length ? topPriorities.join('\n') : '• Full cross-LLM visibility analysis'}

Questions? Reply to this email anytime.

Book a strategy call to discuss your results:
${process.env.BOOKING_URL ?? 'https://lunacal.ai/maxifidigital/'}

—
Maxifi Digital`.trim()

  try {
    const operatorEmail = process.env.OPERATOR_EMAIL ?? process.env.SMTP_USER ?? ''
    await Promise.all([
      transporter.sendMail({
        from: `"Maxifi Visibility" <${process.env.SMTP_USER}>`,
        to: operatorEmail,
        subject: `New report request — ${payload.company_name} (${payload.industry})`,
        text: operatorBody,
      }),
      transporter.sendMail({
        from: `"Maxifi Digital" <${process.env.SMTP_USER}>`,
        to: payload.email,
        subject: 'Your AI Visibility Report request — what happens next',
        text: buyerBody,
      }),
    ])
  } catch (err) {
    console.error('Email send failed:', err)
    // Return success anyway — don't block the buyer on SMTP issues
  }

  return NextResponse.json({ ok: true })
}
