// ============================================================
// Jenkinsfile — Playwright AI Framework
// OS        : Windows (uses bat blocks)
// Browser   : Chromium only
// Workers   : 4 (auto-capped to test count by Playwright)
// Jenkins   : http://localhost:8080
// Repo      : https://github.com/deven037/playwright_ai.git
// ============================================================

pipeline {

  // ── Agent ──────────────────────────────────────────────────
  agent any

  // ── Parameters ─────────────────────────────────────────────
  parameters {
    choice(
      name: 'SUITE',
      choices: ['regression', 'smoke', 'sanity', 'all'],
      description: 'Test suite to execute'
    )
    string(
      name: 'SPEC',
      defaultValue: '',
      description: 'Optional: specific spec file e.g. tests/login.spec.ts'
    )
    string(
      name: 'GREP',
      defaultValue: '',
      description: 'Optional: grep tag filter e.g. @login'
    )
    booleanParam(
      name: 'CLEAN_REPORTS',
      defaultValue: true,
      description: 'Delete previous reports before running'
    )
  }

  // ── Environment ────────────────────────────────────────────
  environment {
    CI           = 'true'
    HEADLESS     = 'true'
    BROWSER      = 'chromium'
    TIMEOUT      = '30000'
    RETRIES      = '2'
    WORKERS      = '4'

    // Credentials — pulled from Jenkins Credentials Store
    BASE_URL     = credentials('PLAYWRIGHT_BASE_URL')
    APP_USERNAME = credentials('PLAYWRIGHT_USERNAME')
    APP_PASSWORD = credentials('PLAYWRIGHT_PASSWORD')

    // Node.js path — explicit for Jenkins Windows service context
    NODE_HOME    = 'C:\\Program Files\\nodejs'
    PATH         = "C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;${env.PATH}"
  }

  // ── Options ────────────────────────────────────────────────
  options {
    buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  // ── Stages ─────────────────────────────────────────────────
  stages {

    // ── 1. Checkout ──────────────────────────────────────────
    stage('Checkout') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '  Checking out source code from GitHub'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        checkout scm
        bat 'git log --oneline -1'
      }
    }

    // ── 2. Verify Tools ──────────────────────────────────────
    stage('Verify Tools') {
      steps {
        echo '  Verifying Node.js and npm versions'
        bat 'node --version'
        bat 'npm --version'
      }
    }

    // ── 3. Install Dependencies ──────────────────────────────
    stage('Install Dependencies') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '  Installing npm dependencies'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        bat 'npm ci'
      }
    }

    // ── 4. Install Playwright Browsers ───────────────────────
    stage('Install Browsers') {
      steps {
        echo '  Installing Playwright Chromium browser + deps'
        bat 'npx playwright install chromium --with-deps'
      }
    }

    // ── 5. Clean Reports ─────────────────────────────────────
    stage('Clean Reports') {
      when {
        expression { return params.CLEAN_REPORTS == true }
      }
      steps {
        echo '  Cleaning previous reports and test-results'
        bat 'npm run clean || exit 0'
      }
    }

    // ── 6. Run Tests ─────────────────────────────────────────
    stage('Run Tests') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo "  Suite  : ${params.SUITE}"
        echo "  Spec   : ${params.SPEC   ?: '(all)'}"
        echo "  Grep   : ${params.GREP   ?: '(none)'}"
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        script {
          def cmd = 'npx playwright test --project=chromium --workers=4'

          // Specific spec file overrides everything
          if (params.SPEC?.trim()) {
            cmd += " ${params.SPEC.trim()}"
          }

          // Grep tag filter
          if (params.GREP?.trim()) {
            cmd += " --grep \"${params.GREP.trim()}\""
          } else if (params.SUITE != 'all') {
            cmd += " --grep @${params.SUITE}"
          }

          echo "  Command: ${cmd}"
          bat cmd
        }
      }
    }
  }

  // ── Post Actions ───────────────────────────────────────────
  post {

    always {
      echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      echo '  Publishing test reports and archiving artifacts'
      echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

      // JUnit XML — powers Jenkins test trend graph
      junit(
        testResults:       'reports/junit/results.xml',
        allowEmptyResults: true
      )

      // Custom HTML Summary — visible directly on Jenkins job page
      publishHTML(target: [
        allowMissing:          true,
        alwaysLinkToLastBuild: true,
        keepAll:               true,
        reportDir:             'reports/custom-report',
        reportFiles:           'summary.html',
        reportName:            'Playwright Custom Report'
      ])

      // Playwright built-in HTML report
      publishHTML(target: [
        allowMissing:          true,
        alwaysLinkToLastBuild: true,
        keepAll:               true,
        reportDir:             'reports/html-report',
        reportFiles:           'index.html',
        reportName:            'Playwright HTML Report'
      ])

      // Archive screenshots, videos, traces, JSON
      archiveArtifacts(
        artifacts:         'test-results/**/*,reports/json-report/results.json',
        allowEmptyArchive: true,
        fingerprint:       true
      )
    }

    success {
      echo '✅  BUILD PASSED — All tests completed successfully.'
    }

    failure {
      echo '❌  BUILD FAILED — One or more tests failed. Check reports above.'
    }

    unstable {
      echo '⚠️   BUILD UNSTABLE — Some tests failed after retries.'
    }
  }
}
