// ============================================================
// Jenkinsfile — Playwright AI Framework
// Pipeline  : Declarative
// Browser   : Chromium only
// Workers   : 4 (Playwright auto-caps to actual test count)
// ============================================================

pipeline {

  // ── Agent ──────────────────────────────────────────────────
  agent any

  // ── Parameters ─────────────────────────────────────────────
  // Allow targeted runs from Jenkins UI without code changes.
  parameters {
    choice(
      name: 'SUITE',
      choices: ['regression', 'smoke', 'sanity', 'all'],
      description: 'Which test suite to execute'
    )
    string(
      name: 'SPEC',
      defaultValue: '',
      description: 'Optional: path to a specific spec file, e.g. tests/login.spec.ts'
    )
    string(
      name: 'GREP',
      defaultValue: '',
      description: 'Optional: grep pattern to filter tests, e.g. @login'
    )
    booleanParam(
      name: 'CLEAN_REPORTS',
      defaultValue: true,
      description: 'Delete previous reports before running'
    )
  }

  // ── Environment ────────────────────────────────────────────
  environment {
    CI              = 'true'
    // Credentials stored in Jenkins Credentials Store — never hardcoded
    BASE_URL        = credentials('PLAYWRIGHT_BASE_URL')
    APP_USERNAME    = credentials('PLAYWRIGHT_USERNAME')
    APP_PASSWORD    = credentials('PLAYWRIGHT_PASSWORD')
    HEADLESS        = 'true'
    BROWSER         = 'chromium'
    TIMEOUT         = '30000'
    RETRIES         = '2'
    WORKERS         = '4'
    // Playwright telemetry off in CI
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '0'
  }

  // ── Options ────────────────────────────────────────────────
  options {
    // Discard old builds — keep last 10 with their artifacts
    buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
    // Abort if the pipeline hangs for more than 60 minutes
    timeout(time: 60, unit: 'MINUTES')
    // Do not run concurrent builds on same branch
    disableConcurrentBuilds()
    // Add timestamps to every console line
    timestamps()
  }

  // ── Stages ─────────────────────────────────────────────────
  stages {

    // ── 1. Checkout ──────────────────────────────────────────
    stage('Checkout') {
      steps {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  📥  Checking out source code"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        checkout scm
        echo "  Branch  : ${env.GIT_BRANCH}"
        echo "  Commit  : ${env.GIT_COMMIT}"
      }
    }

    // ── 2. Install Dependencies ──────────────────────────────
    stage('Install Dependencies') {
      steps {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  📦  Installing npm dependencies"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        sh 'npm ci'
      }
    }

    // ── 3. Install Playwright Browsers ───────────────────────
    stage('Install Browsers') {
      steps {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  🌐  Installing Playwright Chromium browser"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        sh 'npx playwright install chromium --with-deps'
      }
    }

    // ── 4. Clean Reports ─────────────────────────────────────
    stage('Clean Reports') {
      when {
        expression { return params.CLEAN_REPORTS == true }
      }
      steps {
        echo "  🧹  Cleaning previous reports and test-results"
        sh 'npm run clean || true'
      }
    }

    // ── 5. Run Tests ─────────────────────────────────────────
    stage('Run Tests') {
      steps {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  🎭  Executing Playwright tests"
        echo "  Suite   : ${params.SUITE}"
        echo "  Spec    : ${params.SPEC   ?: '(all)'}"
        echo "  Grep    : ${params.GREP   ?: '(none)'}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        script {
          // ── Build the playwright command dynamically ───────
          def cmd = 'npx playwright test --project=chromium'

          // Specific spec file takes highest priority
          if (params.SPEC?.trim()) {
            cmd += " ${params.SPEC.trim()}"
          }

          // Grep filter — supports tags like @login, @smoke
          if (params.GREP?.trim()) {
            cmd += " --grep \"${params.GREP.trim()}\""
          } else if (params.SUITE != 'all') {
            // Fall back to suite-level grep tag
            cmd += " --grep @${params.SUITE}"
          }

          // Workers — always 4 on CI; Playwright caps to test count automatically
          cmd += ' --workers=4'

          // Reporter — CI mode enabled via CI=true env var (config reads this)
          echo "  Command : ${cmd}"
          sh cmd
        }
      }
    }
  }

  // ── Post Actions ───────────────────────────────────────────
  post {

    always {
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  📊  Publishing test reports"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

      // JUnit results — parsed by Jenkins for trend graphs and test history
      junit(
        testResults:          'reports/junit/results.xml',
        allowEmptyResults:    true,
        skipPublishingChecks: false
      )

      // Custom HTML summary report — viewable directly from Jenkins job page
      publishHTML(target: [
        allowMissing:          true,
        alwaysLinkToLastBuild: true,
        keepAll:               true,
        reportDir:             'reports/custom-report',
        reportFiles:           'summary.html',
        reportName:            'Playwright Custom Report',
        reportTitles:          'Test Summary'
      ])

      // Playwright HTML report (more detailed)
      publishHTML(target: [
        allowMissing:          true,
        alwaysLinkToLastBuild: true,
        keepAll:               true,
        reportDir:             'reports/html-report',
        reportFiles:           'index.html',
        reportName:            'Playwright HTML Report',
        reportTitles:          'Playwright Results'
      ])

      // Archive test artifacts — screenshots, videos, traces, JSON
      archiveArtifacts(
        artifacts:            'test-results/**/*,reports/json-report/results.json',
        allowEmptyArchive:    true,
        fingerprint:          true
      )
    }

    success {
      echo "✅  BUILD PASSED — All tests completed successfully."
    }

    failure {
      echo "❌  BUILD FAILED — One or more tests failed. Check the reports above."
    }

    unstable {
      echo "⚠️   BUILD UNSTABLE — Some tests failed after retries."
    }
  }
}
