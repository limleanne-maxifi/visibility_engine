import type { Plan, PlanStep } from '@/lib/planTypes';

export function parsePlan(raw: string): Plan {
  const steps: PlanStep[] = [];

  // Split on STEP_START/STEP_END delimiters
  const segments = raw.split('STEP_START');

  for (const segment of segments) {
    const endIdx = segment.indexOf('STEP_END');
    if (endIdx === -1) continue;

    const block = segment.slice(0, endIdx).trim();
    if (!block) continue;

    const numMatch = block.match(/^NUM:\s*(\d+)/m);
    const titleMatch = block.match(/^TITLE:\s*(.+)$/m);
    const bodyMatch = block.match(/^BODY:\s*([\s\S]+?)(?=\n(?:NUM|TITLE|BODY|$)|\s*$)/m);

    if (!numMatch || !titleMatch || !bodyMatch) {
      throw new Error(`Malformed step block: "${block.slice(0, 80)}"`);
    }

    steps.push({
      num: parseInt(numMatch[1], 10),
      title: titleMatch[1].trim(),
      body: bodyMatch[1].trim(),
    });
  }

  if (steps.length === 0) {
    throw new Error('No steps parsed from Claude response');
  }

  // Extract QUICKWIN — everything after "QUICKWIN:" to end of string
  const quickWinMatch = raw.match(/^QUICKWIN:\s*(.+)$/m);
  if (!quickWinMatch) {
    throw new Error('QUICKWIN not found in Claude response');
  }

  // Validate step count — detect truncation or malformation
  const expectedSteps = raw.includes("No, I haven't tried this yet") ? 3 : 5;
  if (steps.length < expectedSteps) {
    console.warn(
      `[parse] Expected ${expectedSteps} steps but got ${steps.length}. Response may be incomplete.`
    );
    // Don't fail hard, but log for monitoring
  }

  return {
    steps,
    quickWin: quickWinMatch[1].trim(),
  };
}
