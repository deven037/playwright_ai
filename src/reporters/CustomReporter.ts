import {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface ITestEntry {
  title: string;
  fullTitle: string;
  status: string;
  duration: number;
  error?: string;
  retries: number;
}

interface ISuiteEntry {
  name: string;
  tests: ITestEntry[];
}

/**
 * CustomReporter - CI/Local aware Playwright reporter.
 *
 * Local mode : Full ANSI color output, dark HTML summary report.
 * CI mode    : Plain text console (no ANSI - Jenkins renders raw),
 *              HTML report enriched with Jenkins build metadata
 *              (BUILD_NUMBER, BUILD_URL, GIT_BRANCH, JOB_NAME).
 */
class CustomReporter implements Reporter {
  private suites: ISuiteEntry[]     = [];
  private currentSuite: ISuiteEntry | null = null;
  private startTime                  = Date.now();
  private totalPassed                = 0;
  private totalFailed                = 0;
  private totalSkipped               = 0;

  private readonly reportDir = path.resolve('reports', 'custom-report');
  private readonly isCI      = !!process.env.CI;

  // --- ANSI codes (only applied when NOT on CI) -----------------------------
  private c(code: string): string { return this.isCI ? '' : code; }
  private get RESET()  { return this.c('\x1b[0m');  }
  private get GREEN()  { return this.c('\x1b[32m'); }
  private get RED()    { return this.c('\x1b[31m'); }
  private get YELLOW() { return this.c('\x1b[33m'); }
  private get CYAN()   { return this.c('\x1b[36m'); }
  private get BOLD()   { return this.c('\x1b[1m');  }
  private get DIM()    { return this.c('\x1b[2m');  }

  // --- Jenkins environment metadata ----------------------------------------
  private get jenkinsMeta() {
    return {
      buildNumber: process.env.BUILD_NUMBER ?? 'N/A',
      buildUrl:    process.env.BUILD_URL    ?? '',
      jobName:     process.env.JOB_NAME     ?? 'N/A',
      gitBranch:   process.env.GIT_BRANCH   ?? process.env.BRANCH_NAME ?? 'N/A',
      gitCommit:   process.env.GIT_COMMIT   ?? 'N/A',
      nodeName:    process.env.NODE_NAME    ?? 'N/A',
    };
  }

  // --- Lifecycle ------------------------------------------------------------

  onBegin(config: FullConfig, suite: Suite): void {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    this.startTime = Date.now();

    const sep = '='.repeat(50);
    console.log('');
    console.log(`${this.BOLD}${this.CYAN}${sep}${this.RESET}`);
    console.log(`${this.BOLD}${this.CYAN}    PLAYWRIGHT AI FRAMEWORK - EXECUTION STARTED${this.RESET}`);
    console.log(`${this.BOLD}${this.CYAN}${sep}${this.RESET}`);
    console.log(`${this.DIM}  Workers  : ${config.workers}`);
    console.log(`  Retries  : ${config.projects[0]?.retries ?? 0}`);
    console.log(`  Mode     : ${this.isCI ? 'CI (Jenkins)' : 'Local'}${this.RESET}`);
    if (this.isCI) {
      const m = this.jenkinsMeta;
      console.log(`  Job      : ${m.jobName}`);
      console.log(`  Build    : #${m.buildNumber}`);
      console.log(`  Branch   : ${m.gitBranch}`);
      console.log(`  Node     : ${m.nodeName}`);
    }
    console.log('');
  }

  onTestBegin(test: TestCase): void {
    const suiteName = test.parent?.title ?? 'Global';
    if (!this.currentSuite || this.currentSuite.name !== suiteName) {
      this.currentSuite = { name: suiteName, tests: [] };
      this.suites.push(this.currentSuite);
      console.log(`${this.BOLD}    ${suiteName}${this.RESET}`);
    }
    // On CI use plain newline (no \r overwrite - Jenkins buffers lines)
    if (this.isCI) {
      console.log(`     [RUN]  ${test.title}`);
    } else {
      process.stdout.write(`${this.DIM}     [RUN]  ${test.title}${this.RESET}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const icon = result.status === 'passed'  ? '[PASS]' :
                 result.status === 'failed'  ? '[FAIL]' :
                 result.status === 'skipped' ? '[SKIP] ' : '[FAIL]';

    const colorStart = result.status === 'passed'  ? this.GREEN  :
                       result.status === 'failed'  ? this.RED    :
                       result.status === 'skipped' ? this.YELLOW : this.RED;

    const dur = `(${(result.duration / 1000).toFixed(2)}s)`;

    if (this.isCI) {
      console.log(`     ${icon}  ${test.title} ${dur}`);
    } else {
      process.stdout.write(
        `\r     ${colorStart}${icon}  ${test.title} ${this.DIM}${dur}${this.RESET}\n`
      );
    }

    if (result.status === 'passed')  this.totalPassed++;
    else if (result.status === 'failed')  this.totalFailed++;
    else if (result.status === 'skipped') this.totalSkipped++;
    else this.totalFailed++; // Count other statuses (like timedOut) as failed

    const entry: ITestEntry = {
      title:     test.title,
      fullTitle: test.titlePath().join(' > '),
      status:    result.status,
      duration:  result.duration,
      retries:   result.retry,
      error:     result.error?.message,
    };
    if (this.currentSuite) this.currentSuite.tests.push(entry);

    // Error snippet - always plain (readable in both Jenkins and terminal)
    if (result.status === 'failed' && result.error?.message) {
      const snippet = result.error.message.split('\n').slice(0, 4).join('\n');
      console.log(`${this.RED}         ${snippet}${this.RESET}`);
    }
  }

  onEnd(result: FullResult): void {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total         = this.totalPassed + this.totalFailed + this.totalSkipped;
    const sep           = '='.repeat(50);

    console.log('');
    console.log(`${this.BOLD}${this.CYAN}${sep}${this.RESET}`);
    console.log(`${this.BOLD}${this.CYAN}    EXECUTION SUMMARY${this.RESET}`);
    console.log(`${this.BOLD}${this.CYAN}${sep}${this.RESET}`);
    console.log(`  Total    : ${total}`);
    console.log(`  ${this.GREEN}Passed   : ${this.totalPassed}${this.RESET}`);
    console.log(`  ${this.RED}Failed   : ${this.totalFailed}${this.RESET}`);
    console.log(`  ${this.YELLOW}Skipped  : ${this.totalSkipped}${this.RESET}`);
    console.log(`  Duration : ${totalDuration}s`);
    console.log(`  Status   : ${result.status === 'passed' ? `${this.GREEN}[PASS] PASSED` : `${this.RED}[FAIL] FAILED`}${this.RESET}`);
    console.log(`${this.BOLD}${this.CYAN}${sep}${this.RESET}`);
    console.log('');

    this.writeJsonReport(totalDuration, result.status, total);
    this.writeHtmlReport(totalDuration, result.status, total);
  }

  // --- JSON Report ---------------------------------------------------------

  private writeJsonReport(duration: string, status: string, total: number): void {
    const report = {
      generatedAt: new Date().toISOString(),
      environment: this.isCI ? 'CI' : 'Local',
      status,
      duration:    `${duration}s`,
      jenkins:     this.isCI ? this.jenkinsMeta : undefined,
      summary: {
        total,
        passed:  this.totalPassed,
        failed:  this.totalFailed,
        skipped: this.totalSkipped,
        passRate: total > 0 ? `${((this.totalPassed / total) * 100).toFixed(1)}%` : '0%',
      },
      suites: this.suites,
    };
    const filePath = path.join(this.reportDir, 'report.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`    JSON  : ${filePath}`);
  }

  // --- HTML Report ---------------------------------------------------------

  private writeHtmlReport(duration: string, status: string, total: number): void {
    const passRate    = total > 0 ? ((this.totalPassed / total) * 100).toFixed(1) : '0.0';
    const statusColor = status === 'passed' ? '#22c55e' : '#ef4444';
    const meta        = this.jenkinsMeta;

    // Jenkins metadata banner - only rendered on CI
    const jenkinsBanner = this.isCI ? `
    <div class="jenkins-banner">
      <span><strong>${meta.jobName}</strong></span>
      <span>Build <strong>#${meta.buildNumber}</strong></span>
      <span>Branch <strong>${meta.gitBranch}</strong></span>
      <span>Commit <strong>${meta.gitCommit.substring(0, 8)}</strong></span>
      <span>Node <strong>${meta.nodeName}</strong></span>
      ${meta.buildUrl ? `<a href="${meta.buildUrl}" target="_blank">Open in Jenkins</a>` : ''}
    </div>` : '';

    const suiteRows = this.suites.map((suite) => {
      const testRows = suite.tests.map((t) => {
        const color = t.status === 'passed' ? '#22c55e' : t.status === 'skipped' ? '#f59e0b' : '#ef4444';
        const icon  = t.status === 'passed' ? '[PASS]' : t.status === 'skipped' ? '[SKIP]' : '[FAIL]';
        const errRow = t.error
          ? `<tr><td colspan="4"><div class="error">${t.error.replace(/</g, '&lt;').split('\n').slice(0, 3).join('<br>')}</div></td></tr>`
          : '';
        return `
        <tr>
          <td>${icon} ${t.title}</td>
          <td style="color:${color};font-weight:600">${t.status.toUpperCase()}</td>
          <td>${(t.duration / 1000).toFixed(2)}s</td>
          <td>${t.retries}</td>
        </tr>${errRow}`;
      }).join('');
      return `<tr class="suite-row"><td colspan="4">${suite.name}</td></tr>${testRows}`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Playwright AI - ${this.isCI ? `Build #${meta.buildNumber}` : 'Local Run'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:2rem}
    h1{font-size:1.8rem;font-weight:700;color:#38bdf8;margin-bottom:.25rem}
    .sub{color:#64748b;font-size:.875rem;margin-bottom:1.25rem}
    .jenkins-banner{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem;align-items:center;
      background:#1e293b;border:1px solid #334155;border-left:4px solid #f59e0b;
      border-radius:8px;padding:.75rem 1.25rem;margin-bottom:1.5rem;font-size:.85rem}
    .jenkins-banner a{color:#38bdf8;text-decoration:none}
    .status-badge{display:inline-block;padding:.3rem 1rem;border-radius:99px;font-weight:700;
      font-size:.9rem;background:${statusColor}22;color:${statusColor};
      border:1px solid ${statusColor};margin-bottom:1.5rem}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1.5rem}
    .card{background:#1e293b;border-radius:12px;padding:1.25rem;text-align:center;border:1px solid #334155}
    .card .num{font-size:2.5rem;font-weight:800;line-height:1}
    .card .lbl{font-size:.75rem;color:#94a3b8;margin-top:.4rem;text-transform:uppercase;letter-spacing:.06em}
    .passed .num{color:#22c55e}.failed .num{color:#ef4444}.skipped .num{color:#f59e0b}.total .num{color:#38bdf8}
    .passrate{color:#94a3b8;font-size:.875rem;margin-bottom:1.5rem}
    table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden}
    th{background:#0f172a;padding:.75rem 1rem;text-align:left;font-size:.75rem;
      text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:1px solid #334155}
    td{padding:.6rem 1rem;border-bottom:1px solid #0f172a;font-size:.875rem}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:#263548}
    .suite-row td{background:#162032;color:#38bdf8;font-weight:600;padding:.5rem 1rem;font-size:.825rem}
    .error{background:#450a0a;color:#fca5a5;padding:.5rem .75rem;border-radius:6px;
      font-size:.8rem;font-family:'Cascadia Code',monospace;margin:.25rem 0;white-space:pre-wrap}
  </style>
</head>
<body>
  <h1>Playwright AI Framework</h1>
  <div class="sub">
    Generated: ${new Date().toLocaleString()}
    &nbsp;|&nbsp; Duration: ${duration}s
    &nbsp;|&nbsp; Mode: ${this.isCI ? 'CI (Jenkins)' : 'Local'}
  </div>
  ${jenkinsBanner}
  <div class="status-badge">${status === 'passed' ? '[PASS] ALL TESTS PASSED' : '[FAIL] SOME TESTS FAILED'}</div>
  <div class="cards">
    <div class="card total">  <div class="num">${total}</div>               <div class="lbl">Total</div></div>
    <div class="card passed"> <div class="num">${this.totalPassed}</div>    <div class="lbl">Passed</div></div>
    <div class="card failed"> <div class="num">${this.totalFailed}</div>    <div class="lbl">Failed</div></div>
    <div class="card skipped"><div class="num">${this.totalSkipped}</div>   <div class="lbl">Skipped</div></div>
  </div>
  <p class="passrate">Pass Rate: <strong style="color:#38bdf8">${passRate}%</strong></p>
  <table>
    <thead><tr><th>Test Case</th><th>Status</th><th>Duration</th><th>Retries</th></tr></thead>
    <tbody>${suiteRows}</tbody>
  </table>
</body>
</html>`;

    const filePath = path.join(this.reportDir, 'summary.html');
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`    HTML  : ${filePath}\n`);
  }
}

export default CustomReporter;
