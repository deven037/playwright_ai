// ============================================================
// Jenkinsfile — Playwright AI Framework
// OS        : Windows (uses bat blocks)
// Browser   : Chromium only
// Workers   : 4 (auto-capped to test count by Playwright)
// Jenkins   : http://localhost:8080
// Repo      : https://github.com/deven037/playwright_ai.git
//
// Credentials strategy:
//   Reads directly from .env file on the local machine.
//   .env is gitignored and never committed — stays private.
//   Path: C:\Users\user\Desktop\playwright_ai\.env
// ============================================================

// ── .env file location on the local machine ────────────────
// This path is where your .env permanently lives (outside repo).
// Jenkins copies it into the workspace before running tests.
def ENV_FILE_PATH = 'C:\\Users\\user\\Desktop\\playwright_ai\\.env'

pipeline {

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

  // ── CI-level env overrides ─────────────────────────────────
  // Only CI flags and tooling paths here.
  // App credentials (BASE_URL, APP_USERNAME, APP_PASSWORD)
  // are loaded from the .env file in the Load Env stage.
  environment {
    CI        = 'true'
    HEADLESS  = 'true'
    BROWSER   = 'chromium'
    TIMEOUT   = '30000'
    RETRIES   = '2'
    WORKERS   = '4'
    NODE_HOME = 'C:\\Program Files\\nodejs'
    PATH      = "C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;${env.PATH}"
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

    // ── 2. Load .env ──────────────────────────────────────────
    // Copies .env from the local machine into the workspace so
    // dotenv (EnvManager) can read it at test runtime.
    // Also parses it here to expose vars to subsequent bat steps.
    stage('Load .env') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '  Loading credentials from local .env file'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        script {
          // Verify .env exists on the machine
          def envFile = new File(ENV_FILE_PATH)
          if (!envFile.exists()) {
            error ".env file not found at: ${ENV_FILE_PATH}\nPlease ensure the .env file exists on this machine."
          }

          // Copy .env into workspace so dotenv picks it up at runtime
          bat "copy \"${ENV_FILE_PATH}\" \".env\""

          // Parse .env and inject each key=value into the pipeline env
          // so bat commands in later stages also see them if needed
          envFile.eachLine { line ->
            line = line.trim()
            // Skip blank lines and comments
            if (line && !line.startsWith('#')) {
              def parts = line.split('=', 2)
              if (parts.length == 2) {
                def key   = parts[0].trim()
                def value = parts[1].trim()
                env."${key}" = value
              }
            }
          }

          echo "  BASE_URL     : ${env.BASE_URL}"
          echo "  APP_USERNAME : ${env.APP_USERNAME}"
          echo "  APP_PASSWORD : [hidden]"
          echo "  .env loaded and copied to workspace"
        }
      }
    }

    // ── 3. Verify Tools ──────────────────────────────────────
    stage('Verify Tools') {
      steps {
        echo '  Verifying Node.js and npm versions'
        bat 'node --version'
        bat 'npm --version'
      }
    }

    // ── 4. Install Dependencies ──────────────────────────────
    stage('Install Dependencies') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '  Installing npm dependencies'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        bat 'npm ci'
      }
    }

    // ── 5. Install Playwright Browsers ───────────────────────
    stage('Install Browsers') {
      steps {
        echo '  Installing Playwright Chromium browser'
        bat 'npx playwright install chromium --with-deps'
      }
    }

    // ── 6. Clean Reports ─────────────────────────────────────
    stage('Clean Reports') {
      when {
        expression { return params.CLEAN_REPORTS == true }
      }
      steps {
        echo '  Cleaning previous reports and test-results'
        bat 'if exist test-results rmdir /s /q test-results'
        bat 'if exist reports rmdir /s /q reports'
        bat 'if exist logs rmdir /s /q logs'
        bat 'if exist auth rmdir /s /q auth'
      }
    }

    // ── 7. Run Tests ─────────────────────────────────────────
    stage('Run Tests') {
      steps {
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo "  Suite  : ${params.SUITE}"
        echo "  Spec   : ${params.SPEC   ?: '(all)'}"
        echo "  Grep   : ${params.GREP   ?: '(none)'}"
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        script {
          def cmd = 'npx playwright test --project=chromium --workers=4'

          // Specific spec file takes priority over suite/grep
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
      echo '  Publishing reports and archiving artifacts'
      echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

      // JUnit XML — test trend graph in Jenkins
      junit(
        testResults:       'reports/junit/results.xml',
        allowEmptyResults: true
      )

      // Custom dark HTML summary report
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

      // Archive screenshots, videos, traces, JSON report
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
      echo '❌  BUILD FAILED — Check Playwright Custom Report above.'
    }

    unstable {
      echo '⚠️   BUILD UNSTABLE — Some tests failed after retries.'
    }
  }
}
