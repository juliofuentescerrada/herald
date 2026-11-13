#!/usr/bin/env node
// Herald's repository rules (harness-engineering, repository-rules): forbidden terms, spelling and licences.
//
//   node scripts/rules.mjs              every tracked file, and every package's licence (CI)
//   node scripts/rules.mjs --staged     the staged files (git pre-commit)
//   node scripts/rules.mjs <files...>   those files (the Claude Code hook after an edit)
//
// Licences are checked with no arguments, or when Directory.Packages.props or a pnpm lockfile is among the files.
// Exit code 1 on any finding; each finding names the file, line and rule.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const posix = (path) => path.split(sep).join('/');
const textFile = /\.(cs|csproj|props|ts|mjs|js|html|css|scss|json|ya?ml|md|sh)$/i;
const spelled = /\.(cs|ts|mjs|html|md)$/i;
const licenceManifests = /(^|\/)(Directory\.Packages\.props|pnpm-lock\.yaml)$/;

// Repository-relative paths of files that exist, skipping what the rules never read.
export function normalise(files) {
  return [...new Set(files.map((file) => posix(relative(root, resolve(root, file)))))]
    .filter((file) => !file.startsWith('..') && !/(^|\/)(node_modules|bin|obj|dist)\//.test(file))
    .filter((file) => existsSync(join(root, file)));
}

// Forbidden terms (D-3): each term applies to its scopes, minus the exceptions for that file and term.
export function checkTerms(files, config = read('docs/rules/forbidden-terms.json')) {
  const findings = [];
  const inScope = (file, scopes) => scopes.some((scope) => config.scopes[scope].some((prefix) => file.startsWith(prefix)));
  for (const file of files.filter((candidate) => textFile.test(candidate))) {
    const terms = config.terms.filter(
      (term) => inScope(file, term.scopes) && !config.exceptions.some((exception) => exception.path === file && exception.term === term.name),
    );
    if (terms.length === 0) continue;
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    for (const term of terms) {
      const pattern = new RegExp(term.pattern, term.flags ?? '');
      lines.forEach((line, index) => {
        if (pattern.test(line)) findings.push(`${file}:${index + 1}  ${term.name}: ${term.message}`);
      });
    }
  }
  return findings;
}

// Private data (private-data-guard D-1): identifiers, addresses, hosts, paths and IPs a public repository must not hold.
const guidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const emailPattern = /\b[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g;
// Four dotted numbers not inside a longer dotted run, so version numbers and OIDs (1.3.6.1.4.1…) are not taken for IPs.
const ipPattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.]*\d)/g;
// Image names with a density suffix (icon@2x.png) are not addresses.
const fileExtension = /\.(png|jpe?g|gif|svg|webp|ico|avif)$/i;
// Binary files are not read: a NUL byte, or a known binary extension.
const binaryExtension = /\.(png|jpe?g|gif|webp|ico|avif|pdf|woff2?|ttf|otf|eot|zip|gz|tgz|dll|exe|so|dylib|nupkg|snk|pfx)$/i;

// A GUID is synthetic when one of its groups is only zeros, or when it repeats one digit.
export const syntheticGuid = (guid) => guid.split('-').some((group) => /^0+$/.test(group)) || /^(.)\1*$/.test(guid.replace(/-/g, '').toLowerCase());

// Loopback, private, link-local, documentation and broadcast ranges are not public; anything outside 0-255 is no IP.
export function publicIp(ip) {
  const [a, b, c] = ip.split('.').map(Number);
  if (ip.split('.').some((part) => Number(part) > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  // A network address ending in .0.0 is far more often a version number (Chrome/131.0.0.0, 1.0.0.0).
  if (ip.endsWith('.0.0')) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return false;
  return true;
}

export function privateDataIn(line, config) {
  const found = [];
  for (const guid of line.match(guidPattern) ?? []) if (!syntheticGuid(guid)) found.push(['guid', guid, config.identifiers.message]);
  for (const email of line.match(emailPattern) ?? []) {
    const domain = email.split('@')[1].toLowerCase();
    if (fileExtension.test(domain)) continue;
    const allowed = config.emails.allowedAddresses.includes(email.toLowerCase()) || config.emails.allowedDomains.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`));
    if (!allowed) found.push(['email', email, config.emails.message]);
  }
  for (const host of line.match(new RegExp(config.hosts.pattern, 'gi')) ?? []) {
    if (!config.hosts.allowed.includes(host.toLowerCase())) found.push(['directory host', host, config.hosts.message]);
  }
  for (const path of line.match(new RegExp(config.paths.pattern, config.paths.flags ?? 'g')) ?? []) found.push(['personal path', path, config.paths.message]);
  for (const ip of line.match(ipPattern) ?? []) if (publicIp(ip)) found.push(['public IP', ip, config.ips.message]);
  return found;
}

export function checkPrivateData(files, config = read('docs/rules/private-data.json')) {
  const findings = [];
  const excepted = (file, value) => config.exceptions.some((exception) => (exception.path === '*' || exception.path === file) && exception.value.toLowerCase() === value.toLowerCase());
  const skipped = (file) => config.skip.some(({ path }) => file === path || file.endsWith(`/${path}`));
  // Every tracked file that is not binary: private data is as harmful in a shell script or a .slnx as in code.
  for (const file of files.filter((candidate) => !binaryExtension.test(candidate) && !skipped(candidate))) {
    const content = readFileSync(join(root, file));
    if (content.includes(0)) continue;
    content.toString('utf8').split('\n').forEach((line, index) => {
      for (const [kind, value, message] of privateDataIn(line, config)) {
        if (!excepted(file, value)) findings.push(`${file}:${index + 1}  private data (${kind}) ${value}: ${message}`);
      }
    });
  }
  return findings;
}

// Spelling (D-4) through cspell, installed in the web workspace.
export function checkSpelling(files) {
  const targets = files.filter((file) => spelled.test(file));
  if (targets.length === 0) return [];
  const cspell = join(root, 'web/node_modules/cspell/bin.mjs');
  if (!existsSync(cspell)) return [`cspell is not installed: run scripts/bootstrap (or pnpm install in web/).`];
  const result = spawnSync(
    process.execPath,
    [cspell, 'lint', '--no-progress', '--no-summary', '--no-color', '--no-must-find-files', '--config', 'cspell.config.yaml', ...targets],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return `${result.stdout}${result.stderr}`
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /(Unknown|Forbidden) word/.test(line))
    .map((line) => {
      const [, location, kind, word] = line.match(/^(.*?:\d+:\d+) - (Unknown|Forbidden) word \((.*?)\)/) ?? [];
      const where = location ? posix(relative(root, resolve(root, location))) : line;
      return kind === 'Forbidden'
        ? `${where}  spelling: "${word}" is American; Herald writes British English (ADR 0003).`
        : `${where}  spelling: unknown word "${word}": fix it, or add it to docs/rules/words.txt if it is intended.`;
    });
}

// The licence findings for packages already read: web licences as pnpm lists them, .NET packages with the
// licence expression their nuspec declares (undefined when it declares none).
export function licenceFindings({ web = {}, dotnet = [] }, config = read('docs/rules/licences.json')) {
  const findings = [];
  const allowed = (licence) => Object.hasOwn(config.allowed, licence);
  for (const [workspace, listing] of Object.entries(web)) {
    for (const [licence, packages] of Object.entries(listing)) {
      if (allowed(licence)) continue;
      for (const item of packages) findings.push(`${workspace}/pnpm-lock.yaml  licence: ${item.name} ${item.versions.join(', ')} is ${licence}, not on the allowed list.`);
    }
  }
  for (const { id, version, licence } of dotnet) {
    const reviewed = config.packages[id];
    if (reviewed && allowed(reviewed.licence)) continue;
    if (!licence) findings.push(`Directory.Packages.props  licence: ${id} ${version} declares no licence expression; review it and add it to docs/rules/licences.json.`);
    else if (!allowed(licence)) findings.push(`Directory.Packages.props  licence: ${id} ${version} is ${licence}, not on the allowed list.`);
  }
  return findings;
}

// Licences (D-5): every web and .NET package, direct and transitive, against docs/rules/licences.json.
export function checkLicences(config = read('docs/rules/licences.json')) {
  const findings = [];
  const web = {};
  for (const workspace of ['web', 'e2e']) {
    const listed = spawnSync('pnpm', ['licenses', 'list', '--json'], { cwd: join(root, workspace), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (listed.status !== 0) {
      findings.push(`${workspace}/  licences: pnpm could not list them (${listed.stderr.trim().split('\n')[0]}); run pnpm install there.`);
      continue;
    }
    web[workspace] = JSON.parse(listed.stdout);
  }

  let listing;
  try {
    listing = JSON.parse(execFileSync('dotnet', ['list', 'Herald.slnx', 'package', '--include-transitive', '--format', 'json'], {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (error) {
    return [...findings, `Herald.slnx  licences: dotnet could not list the packages (${String(error.message).split('\n')[0]}); run dotnet restore.`];
  }
  const packages = new Map();
  for (const project of listing.projects ?? []) {
    for (const framework of project.frameworks ?? []) {
      for (const item of [...(framework.topLevelPackages ?? []), ...(framework.transitivePackages ?? [])]) packages.set(`${item.id}@${item.resolvedVersion}`, item);
    }
  }
  const cache = process.env.NUGET_PACKAGES ?? join(homedir(), '.nuget', 'packages');
  const dotnet = [...packages.values()].map(({ id, resolvedVersion }) => {
    const nuspec = join(cache, id.toLowerCase(), resolvedVersion.toLowerCase(), `${id.toLowerCase()}.nuspec`);
    const licence = existsSync(nuspec) ? readFileSync(nuspec, 'utf8').match(/<license type="expression">([^<]+)<\/license>/)?.[1] : undefined;
    return { id, version: resolvedVersion, licence };
  });
  return [...findings, ...licenceFindings({ web, dotnet }, config)];
}

export function run(args) {
  const all = args.length === 0;
  const files = all
    ? execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
    : args[0] === '--staged'
      ? execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
      : args;
  const targets = normalise(files);
  const findings = [...checkTerms(targets), ...checkPrivateData(targets), ...checkSpelling(targets)];
  if (all || targets.some((file) => licenceManifests.test(file))) findings.push(...checkLicences());
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = run(process.argv.slice(2));
  for (const finding of findings) console.log(finding);
  process.exit(findings.length === 0 ? 0 : 1);
}
