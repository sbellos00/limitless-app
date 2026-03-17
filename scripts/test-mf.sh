#!/bin/bash
# Mental Fitness Backend Test Suite
# Usage: bash scripts/test-mf.sh
# Requires server running on :3001 and Vite on :3002

PASS=0
FAIL=0

assert_contains() {
  local desc="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -qF "$expected"; then
    echo "  ✓ $desc"
    PASS=$((PASS+1))
  else
    echo "  ✗ $desc"
    echo "    expected to contain: $expected"
    echo "    got: $(echo "$actual" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  ✓ $desc"
    PASS=$((PASS+1))
  else
    echo "  ✗ $desc — expected [$expected], got [$actual]"
    FAIL=$((FAIL+1))
  fi
}

assert_not_contains() {
  local desc="$1" unexpected="$2" actual="$3"
  if echo "$actual" | grep -qF "$unexpected"; then
    echo "  ✗ $desc"
    FAIL=$((FAIL+1))
  else
    echo "  ✓ $desc"
    PASS=$((PASS+1))
  fi
}

jq_val() {
  echo "$1" | node -e "
    const d=require('fs').readFileSync(0,'utf8');
    try {
      const fn = new Function('d', 'return ' + process.argv[1]);
      const r = fn(JSON.parse(d));
      process.stdout.write(String(r));
    } catch(e) { process.stdout.write('ERROR:'+e.message); }
  " "$2"
}

echo "════════════════════════════════════════════════════"
echo "  MENTAL FITNESS BACKEND TEST SUITE"
echo "════════════════════════════════════════════════════"

# Create a fresh test user
curl -s -X POST http://localhost:3001/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"mf-test-v3"}' > /dev/null 2>&1

TEST_USER=$(curl -s http://localhost:3001/users | node -e "
  const d=require('fs').readFileSync(0,'utf8');
  const users=JSON.parse(d);
  const u=users.find(u=>u.name==='mf-test-v3');
  process.stdout.write(u ? u.id : '');
")

if [ -z "$TEST_USER" ]; then
  echo "  WARNING: Could not create test user, skipping isolation tests"
  TEST_USER="00000000-0000-0000-0000-000000000001"
fi
echo "  Test user: $TEST_USER"
echo ""

# ── 1. Empty State ──
echo "── 1. Empty State ──"
R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
assert_contains "GET returns sessions array" '"sessions":[]' "$R"
assert_contains "GET returns customPractices array" '"customPractices":[]' "$R"

# ── 2. Create Sessions ──
echo ""
echo "── 2. Create Sessions ──"

R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"ts1773753466-1","practiceId":"tranquil-breathing","practiceName":"Tranquil Breathing","primarySkill":"breath-control","xpAwarded":10,"timestamp":"2026-03-17T08:00:00Z"}')
assert_contains "Session 1 created" '"ok":true' "$R"
assert_contains "Returns correct id" '"id":"ts1773753466-1"' "$R"

R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"ts1773753466-2","practiceId":"body-scan-a","practiceName":"Body Scan A","primarySkill":"body-awareness","xpAwarded":20,"baseXp":10,"multiplier":2,"timestamp":"2026-03-17T09:00:00Z"}')
assert_contains "Session 2 created (with baseXp/multiplier)" '"ok":true' "$R"

R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"ts1773753466-ci","practiceId":"checkin-mind","practiceName":"Check-in with your mind","xpAwarded":2,"timestamp":"2026-03-17T10:00:00Z"}')
assert_contains "Check-in session created (null skills)" '"ok":true' "$R"

# Server-generated ID
R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"practiceId":"just-being","practiceName":"Just Being","primarySkill":"natural-awareness","xpAwarded":5,"timestamp":"2026-03-17T11:00:00Z"}')
assert_contains "Session without id gets server-generated UUID" '"ok":true' "$R"
assert_contains "Has id field in response" '"id":' "$R"

# ── 3. Validation ──
echo ""
echo "── 3. Validation ──"

R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"practiceName":"No practice ID"}')
assert_contains "Reject session missing practiceId" 'error' "$R"

R=$(curl -s -X POST http://localhost:3001/mf-custom-practices \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"name":"Missing Skill"}')
assert_contains "Reject practice missing primarySkill" 'error' "$R"

R=$(curl -s -X POST http://localhost:3001/mf-custom-practices \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"primarySkill":"breath-control"}')
assert_contains "Reject practice missing name" 'error' "$R"

# ── 4. Field Whitelisting ──
echo ""
echo "── 4. Field Whitelisting ──"

R=$(curl -s -X POST http://localhost:3001/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"ts1773753466-fw","practiceId":"noting-a","practiceName":"Noting A","primarySkill":"meta-awareness","xpAwarded":5,"EVIL":"pwned","timestamp":"2026-03-17T11:30:00Z"}')
assert_contains "Accepts with extra fields" '"ok":true' "$R"

R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
assert_not_contains "Extra fields not in response" "EVIL" "$R"

# ── 5. Data Integrity ──
echo ""
echo "── 5. Data Integrity ──"

R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
COUNT=$(jq_val "$R" "d.sessions.length")
assert_eq "5 sessions total" "5" "$COUNT"

FIRST=$(jq_val "$R" "d.sessions[0].id")
assert_eq "Ordered by timestamp (oldest first)" "ts1773753466-1" "$FIRST"

assert_contains "camelCase: practiceId" '"practiceId":' "$R"
assert_contains "camelCase: primarySkill" '"primarySkill":' "$R"
assert_contains "camelCase: xpAwarded" '"xpAwarded":' "$R"
assert_contains "Boolean: isCustom is false" '"isCustom":false' "$R"

BASE=$(jq_val "$R" "d.sessions.find(s=>s.id==='ts1773753466-2').baseXp")
assert_eq "baseXp preserved on session 2" "10" "$BASE"

MULT=$(jq_val "$R" "d.sessions.find(s=>s.id==='ts1773753466-2').multiplier")
assert_eq "multiplier preserved on session 2" "2" "$MULT"

CISKILL=$(jq_val "$R" "d.sessions.find(s=>s.id==='ts1773753466-ci').primarySkill")
assert_eq "Check-in has null primarySkill" "null" "$CISKILL"

# ── 6. Custom Practices ──
echo ""
echo "── 6. Custom Practices ──"

R=$(curl -s -X POST http://localhost:3001/mf-custom-practices \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"cp1773753466-1","name":"Box Breathing","primarySkill":"breath-control","secondarySkill":"body-awareness"}')
assert_contains "Custom practice created" '"ok":true' "$R"
assert_contains "Returns correct id" '"id":"cp1773753466-1"' "$R"

R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
CPCOUNT=$(jq_val "$R" "d.customPractices.length")
assert_eq "1 custom practice" "1" "$CPCOUNT"
assert_contains "secondarySkill preserved" '"secondarySkill":"body-awareness"' "$R"

# ── 7. Bulk Import ──
echo ""
echo "── 7. Bulk Import ──"

R=$(curl -s -X POST http://localhost:3001/mf-sessions/bulk \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"sessions":[{"id":"bk1773753466-1","practiceId":"glimpse","practiceName":"Glimpse","primarySkill":"nondual-awareness","xpAwarded":15,"timestamp":"2026-03-16T10:00:00Z"},{"id":"bk1773753466-2","practiceId":"yoga-nidra","practiceName":"Yoga Nidra","primarySkill":"body-awareness","secondarySkill":"transcendence","xpAwarded":30,"timestamp":"2026-03-16T11:00:00Z"}],"customPractices":[{"id":"cp1773753466-bk","name":"Wim Hof","primarySkill":"breath-control"}]}')
assert_contains "Bulk import succeeds" '"ok":true' "$R"
assert_contains "Reports 2 sessions imported" '"sessions":2' "$R"
assert_contains "Reports 1 practice imported" '"customPractices":1' "$R"

R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
TOTAL=$(jq_val "$R" "d.sessions.length")
assert_eq "Total sessions now 7 (5+2)" "7" "$TOTAL"
CPTOTAL=$(jq_val "$R" "d.customPractices.length")
assert_eq "Total practices now 2 (1+1)" "2" "$CPTOTAL"

# ── 8. Duplicate Handling ──
echo ""
echo "── 8. Duplicate Handling (INSERT OR IGNORE) ──"

R=$(curl -s -X POST http://localhost:3001/mf-sessions/bulk \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"sessions":[{"id":"bk1773753466-1","practiceId":"glimpse","practiceName":"Glimpse","primarySkill":"nondual-awareness","xpAwarded":15}],"customPractices":[]}')
assert_contains "Re-import same ID succeeds" '"ok":true' "$R"

R=$(curl -s http://localhost:3001/mf-sessions -H "X-User-Id: $TEST_USER")
STILL=$(jq_val "$R" "d.sessions.length")
assert_eq "No duplicate created — still 7" "7" "$STILL"

# ── 9. Multi-User Isolation ──
echo ""
echo "── 9. Multi-User Isolation ──"

R=$(curl -s http://localhost:3001/mf-sessions)
HAS_TEST=$(jq_val "$R" "d.sessions.some(s=>s.id.startsWith('ts-'))")
assert_eq "Default user cannot see test-user sessions" "false" "$HAS_TEST"

# ── 10. Vite Proxy ──
echo ""
echo "── 10. Vite Proxy (/api prefix) ──"

R=$(curl -s http://localhost:3002/api/mf-sessions -H "X-User-Id: $TEST_USER")
assert_contains "Proxy GET returns sessions" '"sessions":' "$R"
PROXY_COUNT=$(jq_val "$R" "d.sessions.length")
assert_eq "Proxy returns same count as direct" "7" "$PROXY_COUNT"

R=$(curl -s -X POST http://localhost:3002/api/mf-sessions \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"proxy1773753466","practiceId":"just-being","practiceName":"Just Being","primarySkill":"natural-awareness","xpAwarded":10,"timestamp":"2026-03-17T13:00:00Z"}')
assert_contains "Proxy POST works" '"ok":true' "$R"

R=$(curl -s -X POST http://localhost:3002/api/mf-custom-practices \
  -H "Content-Type: application/json" -H "X-User-Id: $TEST_USER" \
  -d '{"id":"cp1773753466-proxy","name":"Proxy Practice","primarySkill":"focused-attention"}')
assert_contains "Proxy POST custom practice works" '"ok":true' "$R"

# ── Results ──
echo ""
echo "════════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo "  ALL $PASS TESTS PASSED ✓"
else
  echo "  $PASS passed, $FAIL FAILED"
fi
echo "════════════════════════════════════════════════════"

[ $FAIL -eq 0 ] && exit 0 || exit 1
