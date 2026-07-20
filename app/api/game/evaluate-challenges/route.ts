import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { round_stats, game_stats } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch active dynamic challenges
    const { data: challenges } = await supabase
      .from("dynamic_challenges")
      .select("*")
      .eq("is_active", true);

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ success: true, message: "No active challenges" });
    }

    // 2. Fetch current user progress
    const { data: userProgress } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_id", user.id);

    const progressMap = new Map();
    if (userProgress) {
      userProgress.forEach((p: any) => progressMap.set(p.challenge_id, p));
    }

    // 3. Evaluate rules
    for (const challenge of challenges) {
      const current = progressMap.get(challenge.id);
      if (current?.completed) continue; // Skip completed

      const rules = challenge.conditions;
      let increments = 0;

      if (challenge.rule_type === "per_round" && round_stats && Array.isArray(round_stats)) {
        // Evaluate each round against the rules
        for (const round of round_stats) {
          if (evaluateRules(rules, round)) {
            increments++;
          }
        }
      } else if (challenge.rule_type === "per_game" && game_stats) {
        if (evaluateRules(rules, game_stats)) {
          increments++;
        }
      }

      if (increments > 0) {
        const newProgress = (current?.progress || 0) + increments;
        const isCompleted = newProgress >= challenge.target_value;

        await supabase.from("user_challenge_progress").upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          progress: Math.min(newProgress, challenge.target_value),
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });

        // Auto-grant reward if completed
        if (isCompleted && !current?.completed && challenge.reward_name) {
          // Find the challenge item by name
          const { data: cItems } = await supabase.from("challenge_items").select("id").eq("name", challenge.reward_name).limit(1);
          if (cItems && cItems.length > 0) {
            const cId = cItems[0].id;
            // Check if item already owned
            const { data: inv } = await supabase.from("user_inventory")
              .select("id")
              .eq("user_id", user.id)
              .eq("challenge_item_id", cId);
              
            if (!inv || inv.length === 0) {
              await supabase.from("user_inventory").insert([{
                user_id: user.id,
                challenge_item_id: cId
              }]);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Challenge evaluation error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// Simple rule evaluator
// Example rules object: {"metric": "distance", "operator": "<=", "value": 5}
// Or multiple metrics: {"metric": "time", "operator": "<", "value": 10, "metric2": "score", "operator2": ">=", "value2": 70}
function evaluateRules(rules: any, stats: any): boolean {
  if (!rules || typeof rules !== "object") return false;
  
  // Extract all dynamic rule keys like metric, metric2, metric3
  const metricKeys = Object.keys(rules).filter(k => k.startsWith("metric"));
  
  if (metricKeys.length === 0) return true; // No rules means automatic completion

  for (const mKey of metricKeys) {
    // Get the index (e.g., 'metric2' -> '2', 'metric' -> '')
    const suffix = mKey.replace("metric", "");
    const opKey = `operator${suffix}`;
    const valKey = `value${suffix}`;

    const statName = rules[mKey];
    const operator = rules[opKey];
    const expectedValue = rules[valKey];

    const actualValue = stats[statName];

    // If the stat doesn't exist in the payload, condition fails
    if (actualValue === undefined || actualValue === null) return false;

    if (operator === "<" && !(actualValue < expectedValue)) return false;
    if (operator === "<=" && !(actualValue <= expectedValue)) return false;
    if (operator === ">" && !(actualValue > expectedValue)) return false;
    if (operator === ">=" && !(actualValue >= expectedValue)) return false;
    if (operator === "==" && !(actualValue === expectedValue)) return false;
    if (operator === "!=" && !(actualValue !== expectedValue)) return false;
  }

  return true; // All rules passed
}
