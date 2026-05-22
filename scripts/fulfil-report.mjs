#!/usr/bin/env node
/**
 * fulfil-report.mjs
 *
 * Merges a visibility engine's measured JSON output into a lead's Supabase
 * report_data, turning a teaser (free) report into a full paid report.
 *
 * Usage:
 *   node scripts/fulfil-report.mjs --token <report_token> --engine-json <path/to/output.json>
 *   node scripts/fulfil-report.mjs --token <report_token> --engine-json <path> --confirm
 *
 * Without --confirm: dry run — prints the merge diff but does NOT write to DB.
 * With    --confirm: writes report_data, paid=true, status='report_delivered'.
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY)
 * Source from .env.local:  node --env-file=.env.local scripts/fulfil-report.mjs ...
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Table / column config ───────────────────────────────────────────────────
// The script expects an `aeo_reports` table with these columns:
//   report_token  TEXT  UNIQUE  — lookup key sent to the lead
//   report_data   JSONB         — full ReportData object
//   paid          BOOLEAN       — false on teaser, true after fulfilment
//   status        TEXT          — 'teaser_delivered' → 'report_delivered'
//
// If your schema differs, change TABLE and column names here only.

const TABLE = 'aeo_reports';
const TOKEN_COL = 'report_token';

// ─── CLI parsing ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    token: null,
    engineJsonPath: null,
    localExistingPath: null,
    confirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) result.token = args[++i];
    else if (args[i] === '--engine-json' && args[i + 1]) result.engineJsonPath = args[++i];
    else if (args[i] === '--local-existing' && args[i + 1]) result.localExistingPath = args[++i];
    else if (args[i] === '--confirm') result.confirm = true;
  }

  if (!result.token || !result.engineJsonPath) {
    console.error(`
Usage:
  node --env-file=.env.local scripts/fulfil-report.mjs \\
    --token <report_token> \\
    --engine-json <path/to/engine_output.json> \\
    [--local-existing <path/to/teaser_report_data.json>] \\
    [--confirm]

  --local-existing  Skip Supabase fetch; use a local JSON file as the existing
                    report_data. Safe for offline dry-run testing.
  --confirm         Actually write to DB. Without this flag, runs as dry run.
`);
    process.exit(1);
  }

  return result;
}

// ─── Engine JSON validation ───────────────────────────────────────────────────
// Section 4 shape + Section 7 minimum required fields from DATA_CONTRACT.md
// (inline per reportTypes.ts — no build step required for this script)

function validateEngineJson(raw) {
  const errors = [];

  // Top-level required
  if (!raw.measuredAt || typeof raw.measuredAt !== 'string') {
    errors.push('Missing or non-string: measuredAt (ISO 8601 timestamp)');
  } else if (isNaN(Date.parse(raw.measuredAt))) {
    errors.push('Invalid date: measuredAt must be a valid ISO 8601 string');
  }

  // score
  if (!raw.score || typeof raw.score !== 'object') {
    errors.push('Missing object: score');
  } else {
    if (typeof raw.score.score !== 'number' || raw.score.score < 0 || raw.score.score > 100) {
      errors.push('score.score must be a number 0–100');
    }
    const validBands = ['Critical', 'Low', 'Developing', 'Established', 'Strong'];
    if (!validBands.includes(raw.score.band)) {
      errors.push(`score.band must be one of: ${validBands.join(', ')}`);
    }
    if (typeof raw.score.scoringNote !== 'string' || !raw.score.scoringNote.trim()) {
      errors.push('score.scoringNote must be a non-empty string');
    }
    // ENGINE must NOT supply benchmarkAvg/benchmarkLabel (those are preserved from teaser)
    if ('benchmarkAvg' in raw.score || 'benchmarkLabel' in raw.score) {
      errors.push(
        'score must NOT include benchmarkAvg or benchmarkLabel — these are preserved from the teaser (v1 contract)'
      );
    }
  }

  // s5Competitors
  if (!raw.s5Competitors || typeof raw.s5Competitors !== 'object') {
    errors.push('Missing object: s5Competitors');
  } else {
    const s5 = raw.s5Competitors;
    if (typeof s5.headline !== 'string') errors.push('s5Competitors.headline missing');
    if (typeof s5.summary !== 'string') errors.push('s5Competitors.summary missing');
    if (!Array.isArray(s5.competitors) || s5.competitors.length === 0) {
      errors.push('s5Competitors.competitors must be a non-empty array');
    } else {
      s5.competitors.forEach((c, i) => {
        if (typeof c.name !== 'string') errors.push(`s5Competitors.competitors[${i}].name missing`);
        if (!Array.isArray(c.platforms)) errors.push(`s5Competitors.competitors[${i}].platforms missing`);
        if (typeof c.advantage !== 'string') errors.push(`s5Competitors.competitors[${i}].advantage missing`);
        if (typeof c.yourGap !== 'string') errors.push(`s5Competitors.competitors[${i}].yourGap missing`);
      });
    }
    if (typeof s5.displacementPattern !== 'string') errors.push('s5Competitors.displacementPattern missing');
    if (typeof s5.queriesAnalyzed !== 'number') errors.push('s5Competitors.queriesAnalyzed missing');
  }

  // s6PositioningGap
  if (!raw.s6PositioningGap || typeof raw.s6PositioningGap !== 'object') {
    errors.push('Missing object: s6PositioningGap');
  } else {
    const s6 = raw.s6PositioningGap;
    if (typeof s6.headline !== 'string') errors.push('s6PositioningGap.headline missing');
    if (typeof s6.currentPerception !== 'string') errors.push('s6PositioningGap.currentPerception missing');
    if (typeof s6.targetPerception !== 'string') errors.push('s6PositioningGap.targetPerception missing');
    if (typeof s6.gapScore !== 'number' || s6.gapScore < 0 || s6.gapScore > 100) {
      errors.push('s6PositioningGap.gapScore must be a number 0–100');
    }
    if (!Array.isArray(s6.gaps) || s6.gaps.length === 0) {
      errors.push('s6PositioningGap.gaps must be a non-empty array');
    } else {
      s6.gaps.forEach((g, i) => {
        if (typeof g.gap !== 'string') errors.push(`s6PositioningGap.gaps[${i}].gap missing`);
        if (!['high', 'medium', 'low'].includes(g.severity)) {
          errors.push(`s6PositioningGap.gaps[${i}].severity must be high/medium/low`);
        }
        if (typeof g.fixApproach !== 'string') errors.push(`s6PositioningGap.gaps[${i}].fixApproach missing`);
      });
    }
    if (typeof s6.urgencyNote !== 'string') errors.push('s6PositioningGap.urgencyNote missing');
  }

  // s7QueryGap
  if (!raw.s7QueryGap || typeof raw.s7QueryGap !== 'object') {
    errors.push('Missing object: s7QueryGap');
  } else {
    const s7 = raw.s7QueryGap;
    if (typeof s7.headline !== 'string') errors.push('s7QueryGap.headline missing');
    if (typeof s7.summary !== 'string') errors.push('s7QueryGap.summary missing');
    if (!Array.isArray(s7.queries) || s7.queries.length === 0) {
      errors.push('s7QueryGap.queries must be a non-empty array');
    } else {
      const validStatuses = ['present', 'competitor-cited', 'not-appearing', 'inaccurate'];
      s7.queries.forEach((q, i) => {
        if (typeof q.query !== 'string') errors.push(`s7QueryGap.queries[${i}].query missing`);
        if (!validStatuses.includes(q.status)) {
          errors.push(`s7QueryGap.queries[${i}].status must be one of: ${validStatuses.join(', ')}`);
        }
        if (!['high', 'medium', 'low'].includes(q.priority)) {
          errors.push(`s7QueryGap.queries[${i}].priority must be high/medium/low`);
        }
      });
    }
    if (typeof s7.primaryPlatform !== 'string') errors.push('s7QueryGap.primaryPlatform missing');
    if (typeof s7.queriesAnalyzed !== 'number') errors.push('s7QueryGap.queriesAnalyzed missing');
    if (typeof s7.queriesWon !== 'number') errors.push('s7QueryGap.queriesWon missing');
  }

  // s8ActionQueue
  if (!raw.s8ActionQueue || typeof raw.s8ActionQueue !== 'object') {
    errors.push('Missing object: s8ActionQueue');
  } else {
    const s8 = raw.s8ActionQueue;
    if (typeof s8.headline !== 'string') errors.push('s8ActionQueue.headline missing');
    if (typeof s8.quickWin !== 'string' || !s8.quickWin.trim()) {
      errors.push('s8ActionQueue.quickWin must be a non-empty string');
    }
    if (!Array.isArray(s8.actions) || s8.actions.length === 0) {
      errors.push('s8ActionQueue.actions must be a non-empty array');
    } else {
      const validCategories = ['content', 'authority', 'technical', 'competitive'];
      s8.actions.forEach((a, i) => {
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(a.week)) {
          errors.push(`s8ActionQueue.actions[${i}].week must be 1–8`);
        }
        if (typeof a.title !== 'string') errors.push(`s8ActionQueue.actions[${i}].title missing`);
        if (typeof a.description !== 'string') errors.push(`s8ActionQueue.actions[${i}].description missing`);
        if (!['low', 'medium', 'high'].includes(a.effort)) {
          errors.push(`s8ActionQueue.actions[${i}].effort must be low/medium/high`);
        }
        if (!['low', 'medium', 'high'].includes(a.impact)) {
          errors.push(`s8ActionQueue.actions[${i}].impact must be low/medium/high`);
        }
        if (!validCategories.includes(a.category)) {
          errors.push(`s8ActionQueue.actions[${i}].category must be one of: ${validCategories.join(', ')}`);
        }
      });
    }
    if (typeof s8.expectedOutcome !== 'string') errors.push('s8ActionQueue.expectedOutcome missing');
  }

  return errors;
}

// ─── Merge logic ─────────────────────────────────────────────────────────────
// PRESERVE: meta.(token|entityName|industry|occupation|website),
//           score.(benchmarkAvg|benchmarkLabel), s1–s4, reportPrice, unlockUrl, calendlyUrl
// OVERWRITE: meta.generatedAt (← measuredAt), score.(score|band|scoringNote),
//            s5Competitors, s6PositioningGap, s7QueryGap, s8ActionQueue

function buildMerged(existing, engine) {
  return {
    // meta — preserve identity fields, overwrite generatedAt
    meta: {
      token: existing.meta.token,
      generatedAt: engine.measuredAt,       // OVERWRITE
      entityName: existing.meta.entityName, // PRESERVE
      industry: existing.meta.industry,     // PRESERVE
      occupation: existing.meta.occupation, // PRESERVE
      website: existing.meta.website,       // PRESERVE
      paid: true,                           // always true after fulfilment
    },

    // score — deep merge: overwrite measured fields, preserve benchmark
    score: {
      score: engine.score.score,            // OVERWRITE
      band: engine.score.band,              // OVERWRITE
      benchmarkAvg: existing.score.benchmarkAvg,     // PRESERVE
      benchmarkLabel: existing.score.benchmarkLabel, // PRESERVE
      scoringNote: engine.score.scoringNote, // OVERWRITE
    },

    // Free sections — PRESERVE entirely
    s1Visibility: existing.s1Visibility,
    s2Diagnosis: existing.s2Diagnosis,
    s3Platforms: existing.s3Platforms,
    s4Positioning: existing.s4Positioning,

    // Paid sections — OVERWRITE with engine measurements
    s5Competitors: engine.s5Competitors,
    s6PositioningGap: engine.s6PositioningGap,
    s7QueryGap: engine.s7QueryGap,
    s8ActionQueue: engine.s8ActionQueue,

    // CTAs — PRESERVE
    reportPrice: existing.reportPrice,
    unlockUrl: existing.unlockUrl,
    calendlyUrl: existing.calendlyUrl,
  };
}

// ─── Diff printer ─────────────────────────────────────────────────────────────

function printDiff(existing, merged, engine) {
  const line = (label, before, after) => {
    const changed = JSON.stringify(before) !== JSON.stringify(after);
    const symbol = changed ? '~ ' : '  ';
    if (changed) {
      console.log(`\x1b[33m${symbol}${label}\x1b[0m`);
      console.log(`     before: \x1b[31m${JSON.stringify(before)}\x1b[0m`);
      console.log(`     after:  \x1b[32m${JSON.stringify(after)}\x1b[0m`);
    } else {
      console.log(`${symbol}${label}: \x1b[90m(unchanged)\x1b[0m`);
    }
  };

  const section = (name, before, after) => {
    const changed = JSON.stringify(before) !== JSON.stringify(after);
    if (changed) {
      console.log(`\x1b[33m~ ${name}\x1b[0m \x1b[32m← ENGINE (OVERWRITE)\x1b[0m`);
    } else {
      console.log(`  ${name}: \x1b[90m(unchanged)\x1b[0m`);
    }
  };

  console.log('\n\x1b[1m── MERGE DIFF ──────────────────────────────────────────\x1b[0m');
  console.log('\x1b[90mFormat:  ~ field (changed)  |  (unchanged)\x1b[0m\n');

  console.log('\x1b[1mmeta\x1b[0m');
  line('  .token',        existing.meta.token,        merged.meta.token);
  line('  .generatedAt',  existing.meta.generatedAt,  merged.meta.generatedAt);
  line('  .entityName',   existing.meta.entityName,   merged.meta.entityName);
  line('  .industry',     existing.meta.industry,     merged.meta.industry);
  line('  .occupation',   existing.meta.occupation,   merged.meta.occupation);
  line('  .website',      existing.meta.website,      merged.meta.website);
  line('  .paid',         existing.meta.paid,         merged.meta.paid);

  console.log('\n\x1b[1mscore\x1b[0m');
  line('  .score',          existing.score.score,          merged.score.score);
  line('  .band',           existing.score.band,           merged.score.band);
  line('  .benchmarkAvg',   existing.score.benchmarkAvg,   merged.score.benchmarkAvg);
  line('  .benchmarkLabel', existing.score.benchmarkLabel, merged.score.benchmarkLabel);
  line('  .scoringNote',    existing.score.scoringNote,    merged.score.scoringNote);

  console.log('\n\x1b[1mFree sections (PRESERVE)\x1b[0m');
  section('s1Visibility', existing.s1Visibility, merged.s1Visibility);
  section('s2Diagnosis',  existing.s2Diagnosis,  merged.s2Diagnosis);
  section('s3Platforms',  existing.s3Platforms,  merged.s3Platforms);
  section('s4Positioning',existing.s4Positioning,merged.s4Positioning);

  console.log('\n\x1b[1mPaid sections (OVERWRITE)\x1b[0m');
  section('s5Competitors',    existing.s5Competitors,    engine.s5Competitors);
  section('s6PositioningGap', existing.s6PositioningGap, engine.s6PositioningGap);
  section('s7QueryGap',       existing.s7QueryGap,       engine.s7QueryGap);
  section('s8ActionQueue',    existing.s8ActionQueue,    engine.s8ActionQueue);

  console.log('\n\x1b[1mDB row fields\x1b[0m');
  console.log(`\x1b[33m~ paid\x1b[0m`);
  console.log(`     before: \x1b[31mfalse\x1b[0m`);
  console.log(`     after:  \x1b[32mtrue\x1b[0m`);
  console.log(`\x1b[33m~ status\x1b[0m`);
  console.log(`     before: \x1b[31m(existing status)\x1b[0m`);
  console.log(`     after:  \x1b[32m'report_delivered'\x1b[0m`);

  console.log('\n\x1b[90m────────────────────────────────────────────────────────\x1b[0m\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { token, engineJsonPath, localExistingPath, confirm } = parseArgs();

  // 1. Load engine JSON
  let engineRaw;
  try {
    const absPath = resolve(process.cwd(), engineJsonPath);
    engineRaw = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (err) {
    console.error(`\x1b[31mERROR: Cannot read engine JSON at '${engineJsonPath}'\x1b[0m`);
    console.error(err.message);
    process.exit(1);
  }

  // 2. Validate engine JSON — abort before touching DB if invalid
  console.log('\nValidating engine JSON…');
  const validationErrors = validateEngineJson(engineRaw);
  if (validationErrors.length > 0) {
    console.error('\x1b[31m\nEngine JSON is INVALID — aborting. Fix these issues before merging:\x1b[0m');
    validationErrors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }
  console.log('\x1b[32m✓ Engine JSON is valid\x1b[0m');

  // 3a. LOCAL mode: load existing report_data from file (skips Supabase)
  let existingReportData;
  let row;

  if (localExistingPath) {
    console.log(`\n\x1b[33m[LOCAL MODE]\x1b[0m Loading existing report_data from file: ${localExistingPath}`);
    try {
      const absPath = resolve(process.cwd(), localExistingPath);
      existingReportData = JSON.parse(readFileSync(absPath, 'utf8'));
    } catch (err) {
      console.error(`\x1b[31mERROR: Cannot read local existing JSON at '${localExistingPath}'\x1b[0m`);
      console.error(err.message);
      process.exit(1);
    }
    row = { paid: existingReportData.meta?.paid ?? false, status: 'teaser_delivered' };
  } else {
    // 3b. Connect to Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('\x1b[31mERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set.\x1b[0m');
      console.error('Hint: run with  node --env-file=.env.local scripts/fulfil-report.mjs ...');
      console.error('      Or use  --local-existing <path>  for an offline dry run.');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch existing row by report_token
    console.log(`\nFetching row for token: \x1b[1m${token}\x1b[0m from \x1b[1m${TABLE}\x1b[0m…`);
    const { data: fetchedRow, error: fetchErr } = await supabase
      .from(TABLE)
      .select('*')
      .eq(TOKEN_COL, token)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') {
        console.error(`\x1b[31mERROR: No row found for token '${token}' in ${TABLE}.\x1b[0m`);
        console.error('Check the token is correct and the row exists before running fulfilment.');
      } else {
        console.error('\x1b[31mERROR: Supabase fetch failed:\x1b[0m', fetchErr.message);
      }
      process.exit(1);
    }

    row = fetchedRow;
    existingReportData = row.report_data;
  }

  if (!existingReportData || typeof existingReportData !== 'object') {
    console.error(`\x1b[31mERROR: report_data is null or not an object.\x1b[0m`);
    console.error('The teaser report_data must be populated before fulfilment can run.');
    process.exit(1);
  }

  console.log('\x1b[32m✓ Existing report_data loaded\x1b[0m');
  console.log(`  entityName : ${existingReportData.meta?.entityName ?? '(missing)'}`);
  console.log(`  paid       : ${row.paid}`);
  console.log(`  status     : ${row.status}`);

  if (row.paid === true) {
    console.warn('\n\x1b[33mWARNING: This report is already marked paid=true.\x1b[0m');
    console.warn('Continuing will overwrite the existing paid sections. Add --confirm to proceed anyway.\n');
  }

  // 5. Build merged report_data
  const merged = buildMerged(existingReportData, engineRaw);

  // 6. Print diff
  printDiff(existingReportData, merged, engineRaw);

  // 7. Dry-run gate
  if (!confirm) {
    console.log('\x1b[33m⚠ DRY RUN — no changes written to DB.\x1b[0m');
    if (localExistingPath) {
      console.log('(Local mode: --confirm would still require real Supabase env vars to write.)');
    }
    console.log('Re-run with \x1b[1m--confirm\x1b[0m to perform the actual merge.\n');
    process.exit(0);
  }

  // 8a. Block write in local mode — you need real Supabase for a confirmed write
  if (localExistingPath) {
    console.error('\x1b[31mERROR: --confirm with --local-existing is not allowed.\x1b[0m');
    console.error('Remove --local-existing and provide real Supabase env vars to perform a write.');
    process.exit(1);
  }

  // 8b. Write to Supabase
  console.log('\x1b[1mWriting to Supabase…\x1b[0m');
  const supabaseForWrite = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
  );
  const { error: writeErr } = await supabaseForWrite
    .from(TABLE)
    .update({
      report_data: merged,
      paid: true,
      status: 'report_delivered',
    })
    .eq(TOKEN_COL, token);

  if (writeErr) {
    console.error('\x1b[31mERROR: Supabase write failed:\x1b[0m', writeErr.message);
    process.exit(1);
  }

  // 9. Confirm + print report URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  const reportUrl = `${baseUrl}/r/${token}`;

  console.log('\x1b[32m\n✓ Fulfilment complete\x1b[0m');
  console.log(`  report_data  → merged (paid sections populated)`);
  console.log(`  paid         → true`);
  console.log(`  status       → report_delivered`);
  console.log(`\n\x1b[1mReport URL:\x1b[0m ${reportUrl}\n`);
}

main().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
