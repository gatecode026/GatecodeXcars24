import test from "node:test";
import assert from "node:assert/strict";

test("Security & Data Integrity: CSV Formula Injection Sanitization", () => {
  const sanitizeFormula = (val) => {
    let s = String(val ?? "").trim();
    if (/^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // Test 1: Equal sign formula injection attempt
  assert.equal(sanitizeFormula("=cmd|'/C calc'!A0"), "'=cmd|'/C calc'!A0");

  // Test 2: Plus sign formula injection attempt
  assert.equal(sanitizeFormula("+1+2"), "'+1+2");

  // Test 3: Hyphen formula injection attempt
  assert.equal(sanitizeFormula("-2+3"), "'-2+3");

  // Test 4: At sign formula injection attempt (with comma -> quoted)
  assert.equal(sanitizeFormula("@SUM(1,2)"), `"'@SUM(1,2)"`);

  // Test 5: Normal customer text without formula
  assert.equal(sanitizeFormula("Rahul Sharma"), "Rahul Sharma");

  // Test 6: Text with comma and quote
  assert.equal(sanitizeFormula('John, Doe "VIP"'), '"John, Doe ""VIP"""');
});

test("Bulk Import: Chunking logic partitions large datasets into 250 rows", () => {
  const totalRows = 620;
  const CHUNK_SIZE = 250;
  const chunks = [];

  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    chunks.push({ start: i, length: Math.min(CHUNK_SIZE, totalRows - i) });
  }

  assert.equal(chunks.length, 3, "620 rows should be split into 3 chunks");
  assert.equal(chunks[0].length, 250);
  assert.equal(chunks[1].length, 250);
  assert.equal(chunks[2].length, 120);
});
