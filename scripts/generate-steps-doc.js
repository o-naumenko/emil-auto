/*
 Generates a Markdown file with test.step titles without running tests.
 Scans the ./tests directory, parses TypeScript files via TypeScript compiler API,
 and outputs Markdown grouped by full test title (including describe blocks).
*/

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const TEST_ROOT = path.resolve(__dirname, '..', 'tests');
const OUTPUT = path.resolve(__dirname, '..', 'test-cases.md');

function isIdentifier(node, name) {
  return ts.isIdentifier(node) && node.escapedText === name;
}

function isCall(node, name) {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.escapedText === name;
}

function isTestDot(node, prop) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.escapedText === 'test' &&
    node.expression.name.escapedText === prop
  );
}

function getStringArg(node, index = 0) {
  const arg = node.arguments && node.arguments[index];
  if (!arg) return undefined;
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text;
  return undefined;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkDir(full));
    else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) files.push(full);
  }
  return files;
}

function parseFile(file) {
  const sourceText = fs.readFileSync(file, 'utf-8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const results = [];

  const describeStack = [];
  const addVarStack = []; // track if identifier 'add' is bound in current scope

  function withDescribe(title, cb) {
    describeStack.push(title);
    try { cb(); } finally { describeStack.pop(); }
  }

  function visit(node) {
    // Track bindings like: const { add, attach } = createStepLogger(...)
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
      const hasAdd = node.name.elements.some(el => ts.isBindingElement(el) && ts.isIdentifier(el.name) && el.name.escapedText === 'add');
      if (hasAdd) addVarStack.push(true);
    }

    // test.describe('title', () => { ... })
    if (isCall(node, 'test') || isCall(node, 'describe')) {
      // This block handles common "import { test }" pattern where test.describe exists.
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.escapedText === 'test' &&
      node.expression.name.escapedText === 'describe'
    ) {
      const title = getStringArg(node, 0);
      const cb = node.arguments[1];
      if (typeof title === 'string' && (ts.isFunctionExpression(cb) || ts.isArrowFunction(cb))) {
        withDescribe(title, () => {
          if (cb.body) ts.forEachChild(cb.body, visit);
        });
        return; // don't double-visit callback
      }
    }

    // test('title', () => { ... })
    if (isCall(node, 'test')) {
      const title = getStringArg(node, 0);
      const cb = node.arguments[1];
      if (typeof title === 'string' && (ts.isFunctionExpression(cb) || ts.isArrowFunction(cb))) {
        const fullTitle = [...describeStack, title].join(' > ');
        const steps = [];
        function collect(n) {
          // test.step('step title', async () => {})
          if (isTestDot(n, 'step')) {
            const stepTitle = getStringArg(n, 0);
            const stepCb = n.arguments[1];
            const sub = [];
            // Walk only inside this step callback to pick up add('...') calls
            if (stepCb && (ts.isFunctionExpression(stepCb) || ts.isArrowFunction(stepCb)) && stepCb.body) {
              function collectAdd(m) {
                if (
                  ts.isCallExpression(m) &&
                  ts.isIdentifier(m.expression) &&
                  m.expression.escapedText === 'add'
                ) {
                  const msg = getStringArg(m, 0);
                  if (msg) sub.push(msg);
                }
                ts.forEachChild(m, collectAdd);
              }
              collectAdd(stepCb.body);
            }
            if (stepTitle) steps.push({ title: stepTitle, sub });
            // Do not recurse into this step callback again for finding nested steps to avoid duplicates.
            return;
          }
          ts.forEachChild(n, collect);
        }
        if (cb.body) ts.forEachChild(cb.body, collect);
        results.push({ title: fullTitle, steps });
        // fallthrough to continue traversal
      }
    }

    ts.forEachChild(node, visit);
    // Pop add binding if we pushed for this declaration
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
      const hasAdd = node.name.elements.some(el => ts.isBindingElement(el) && ts.isIdentifier(el.name) && el.name.escapedText === 'add');
      if (hasAdd) addVarStack.pop();
    }
  }

  ts.forEachChild(source, visit);
  return results;
}

function generateMarkdown(all) {
  let md = '';
  md += '# Test Steps\n\n';
  // Filter tests with at least one step
  const filtered = all.filter(t => t.steps && t.steps.length);
  // Sort by title for stability
  filtered.sort((a, b) => a.title.localeCompare(b.title));
  for (const t of filtered) {
    md += `## ${t.title}\n`;
    for (const s of t.steps) {
      if (typeof s === 'string') {
        md += `- ${s}\n`;
      } else if (s && typeof s === 'object') {
        const title = s.title ?? '';
        md += `- ${title}\n`;
        if (Array.isArray(s.sub)) {
          for (const msg of s.sub) {
            if (typeof msg === 'string' && msg.trim()) {
              md += `  - ${msg}\n`;
            }
          }
        }
      }
    }
    md += '\n';
  }
  return md;
}

function main() {
  if (!fs.existsSync(TEST_ROOT)) {
    console.error('Tests directory not found:', TEST_ROOT);
    process.exit(1);
  }
  const files = walkDir(TEST_ROOT);
  const all = [];
  for (const f of files) {
    try {
      const res = parseFile(f);
      all.push(...res);
    } catch (e) {
      console.warn('Failed to parse', f, e.message);
    }
  }

  const outDir = path.dirname(OUTPUT);
  fs.mkdirSync(outDir, { recursive: true });
  const md = generateMarkdown(all);
  fs.writeFileSync(OUTPUT, md, 'utf-8');
  console.log('Generated', path.relative(process.cwd(), OUTPUT));
}

if (require.main === module) main();
