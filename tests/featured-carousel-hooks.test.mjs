import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('featured carousel keeps hook order when projects load and disappear', () => {
  const source = fs.readFileSync(new URL('../src/components/sections/LandingPageContent.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('function FeaturedProjectMotionCarousel(');
  const end = source.indexOf('  const handleMouseMove', start);
  // Execute the actual initialization and empty-state branch without a browser.
  const code = ts.transpileModule(source.slice(start, end) + '\nreturn null;\n}', {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  let hooks = [];
  const hook = name => (...args) => { hooks.push(name); return name === 'state' ? [args[0], () => {}] : args[0]; };
  const context = {
    exports: {}, require: () => ({ jsx: () => null, jsxs: () => null }),
    FALLBACK_PREVIEW_PROJECTS: [], Building2: () => null, Link: () => null, ArrowRight: () => null,
    useState: hook('state'), useMotionValue: hook('motion'), useSpring: hook('spring'),
    useTransform: hook('transform'), useCallback: hook('callback'), useEffect: hook('effect'),
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  const sequences = [[], [{ id: 1 }], []].map(projects => {
    hooks = [];
    context.FeaturedProjectMotionCarousel({ projects });
    return [...hooks];
  });
  assert.deepEqual(sequences[1], sequences[0]);
  assert.deepEqual(sequences[2], sequences[0]);
});
