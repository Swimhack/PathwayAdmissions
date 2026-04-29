const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const redirectPages = new Set([
  'alexandra-wax.html',
  'careers--majors-packages.html',
  'middlehigh-school-admissions.html',
  'new-page.html',
  'our-results.html',
  'ourservices.html',
  'penny-linsenmayer.html',
  'who-we-are.html',
]);
const fullPages = htmlFiles.filter((file) => !redirectPages.has(file));

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function localPathFromRef(ref) {
  const withoutQuery = ref.split(/[?#]/)[0];
  const normalized = withoutQuery.replace(/^\.\//, '').replace(/\//g, path.sep);
  return path.join(root, normalized);
}

function getRefs(html) {
  const refs = [];
  const attrRe = /\b(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = attrRe.exec(html))) refs.push(match[1]);
  return refs;
}

function isLocalRef(ref) {
  return (
    ref &&
    !ref.startsWith('#') &&
    !ref.startsWith('http://') &&
    !ref.startsWith('https://') &&
    !ref.startsWith('mailto:') &&
    !ref.startsWith('tel:')
  );
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test('full pages include production head metadata', () => {
  for (const file of fullPages) {
    const html = read(file);
    assert.match(html, /<title>[^<]+<\/title>/i, `${file} missing title`);
    assert.match(html, /<meta name="description" content="[^"]+"/i, `${file} missing meta description`);
    assert.match(html, /<link rel="canonical" href="https:\/\/pathwayadmissions\.com\//i, `${file} missing canonical`);
    assert.match(html, /<meta name="viewport"/i, `${file} missing viewport`);
  }
});

test('full pages include shared navigation, CSS, and scripts', () => {
  for (const file of fullPages) {
    const html = read(file);
    assert.match(html, /data-nav/i, `${file} missing shared nav`);
    assert.match(html, /data-nav-toggle/i, `${file} missing mobile nav toggle`);
    assert.match(html, /href="\.\/styles\.css"/i, `${file} missing stylesheet`);
    assert.match(html, /src="\.\/scripts\.js"/i, `${file} missing scripts.js`);
    assert.match(html, /src="\.\/analytics\.js"/i, `${file} missing analytics.js`);
    assert.match(html, /href="\.\/contact\.html"/i, `${file} missing contact CTA/link`);
  }
});

test('local links and assets resolve', () => {
  for (const file of htmlFiles) {
    const html = read(file);
    for (const ref of getRefs(html).filter(isLocalRef)) {
      const target = localPathFromRef(ref);
      assert.ok(fs.existsSync(target), `${file} references missing local file ${ref}`);
    }
  }
});

test('CSS asset URLs resolve', () => {
  const css = read('styles.css');
  const refs = [];
  const urlRe = /url\(["']?([^"')]+)["']?\)/g;
  let match;
  while ((match = urlRe.exec(css))) refs.push(match[1]);
  for (const ref of refs.filter(isLocalRef)) {
    const target = localPathFromRef(ref);
    assert.ok(fs.existsSync(target), `styles.css references missing local file ${ref}`);
  }
});

test('mobile navigation script supports production interactions', () => {
  const js = read('scripts.js');
  assert.match(js, /aria-expanded/i, 'nav script should update aria-expanded');
  assert.match(js, /Escape/i, 'nav script should close on Escape');
  assert.match(js, /matchMedia/i, 'nav script should respond to viewport changes');
  assert.match(js, /navLocked/i, 'nav script should lock body scroll when open');
});

test('legacy redirect pages are noindex and point to canonical replacements', () => {
  for (const file of redirectPages) {
    const html = read(file);
    assert.match(html, /noindex,follow/i, `${file} should be noindex`);
    assert.match(html, /http-equiv="refresh"/i, `${file} missing refresh redirect`);
    assert.match(html, /rel="canonical"/i, `${file} missing canonical destination`);
  }
});

test('contact form has required production fields and guarded validation', () => {
  const html = read('contact.html');
  assert.match(html, /<form[^>]+data-guard/i, 'contact form missing data guard');
  for (const field of ['name', 'email', 'service', 'timeline', 'message']) {
    const re = new RegExp(`\\b(name|id)=["']${field}["']`, 'i');
    assert.match(html, re, `contact form missing ${field}`);
  }
  assert.match(html, /type="email"/i, 'email field should use type=email');
  assert.match(html, /required/i, 'contact form should include required fields');
});

test('team page uses named person assets', () => {
  const html = read('team.html');
  for (const expected of [
    'Alex_Wax_2.jpeg',
    'penny-linsenmayer-square_orig.jpeg',
    'Tracy Knight.jpg',
    'ALEX_ PETERSON.jpeg',
    'ABIGAIL_MYERS.jpg',
    'Devanshi Patel.jpg',
  ]) {
    assert.ok(html.includes(`./assets/live/${expected}`), `team page missing ${expected}`);
  }
  assert.ok(!html.includes('headshot-2016'), 'team page should not use headshot-2016');
});

test('core production files exist', () => {
  for (const file of ['robots.txt', 'sitemap.xml', '.htaccess', 'styles.css', 'scripts.js', 'analytics.js']) {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  }
  assert.ok(fs.existsSync(path.join(root, 'assets', 'pathway-logo.png')), 'missing Pathway logo');
  assert.ok(fs.existsSync(path.join(root, 'assets', 'live', 'manifest.json')), 'missing live asset manifest');
});

if (process.exitCode) process.exit(process.exitCode);
console.log(`\n${fullPages.length} full pages and ${redirectPages.size} redirects checked.`);

