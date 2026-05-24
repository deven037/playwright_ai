// ============================================================
// Jenkinsfile — Playwright AI Framework
// OS        : Windows (uses bat blocks)
// Browser   : Chromium only
// Workers   : 4
// Jenkins   : http://localhost:8080
// Repo      : https://github.com/deven037/playwright_ai.git
//
// NOTE:
// Keep .env inside project root and add it to .gitignore
// ============================================================

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

  // ── Environment ────────────────────────────────────────────
  environment {

    CI        = 'true'
    HEADLESS  = 'true'
    BROWSER   = 'chromium'
    TIMEOUT   = '30000'
    RETRIES   = '2'
    WORKERS   = '4'

    NODE_HOME = 'C:/Program Files/nodejs'

    PATH = "C:/Program Files/nodejs;C:/Program Files/Git/cmd;${env.PATH}"
  }

  // ── Options ────────────────────────────────────────────────
  options {

    buildDiscarder(logRotator(
      numToKeepStr: '10',
      artifactNumToKeepStr: '10'
    ))

    timeout(time: 60, unit: 'MINUTES')

    disableConcurrentBuilds()

    timestamps()
  }

  // ── Stages ─────────────────────────────────────────────────
  stages {

    // ── 1. Checkout ──────────────────────────────────────────
    stage('Checkout') {

      steps {

        echo '================================================'
        echo 'Checking out source code from GitHub'
        echo '================================================'

        checkout scm

        bat 'git log --oneline -1'
      }
    }

    // ── 2. Load .env ─────────────────────────────────────────
    stage('Load .env') {

      steps {

        echo '================================================'
        echo 'Loading credentials from .env file'
        echo '================================================'

        bat """
          if not exist ".env" (
            echo .env file not found in project root
            exit /b 1
          )

          echo .env file loaded successfully
        """
      }
    }

    // ── 3. Verify Tools ──────────────────────────────────────
    stage('Verify Tools') {

      steps {

        echo 'Verifying Node.js and npm versions'

        bat 'node --version'

        bat 'npm --version'
      }
    }

    // ── 4. Install Dependencies ──────────────────────────────
    stage('Install Dependencies') {

      steps {

        echo '================================================'
        echo 'Installing npm dependencies'
        echo '================================================'

        bat 'npm ci'
      }
    }

    // ── 5. Install Playwright Browsers ───────────────────────
    stage('Install Browsers') {

      steps {

        echo 'Installing Playwright Chromium browser'

        bat 'npx playwright install chromium'
      }
    }

    // ── 6. Clean Reports ─────────────────────────────────────
    stage('Clean Reports') {

      when {
        expression {
          return params.CLEAN_REPORTS == true
        }
      }

      steps {

        echo 'Cleaning previous reports and test-results'

        bat 'if exist test-results rmdir /s /q test-results'

        bat 'if exist reports rmdir /s /q reports'

        bat 'if exist logs rmdir /s /q logs'

        bat 'if exist auth rmdir /s /q auth'
      }
    }

    // ── 7. Run Tests ─────────────────────────────────────────
    stage('Run Tests') {

      steps {

        echo '================================================'
        echo "Suite  : ${params.SUITE}"
        echo "Spec   : ${params.SPEC ?: '(all)'}"
        echo "Grep   : ${params.GREP ?: '(none)'}"
        echo '================================================'

        script {

          def cmd = 'npx playwright test --project=chromium --workers=4'

          // Specific spec file takes priority
          if (params.SPEC?.trim()) {
            cmd += " ${params.SPEC.trim()}"
          }

          // Grep filter
          if (params.GREP?.trim()) {

            cmd += " --grep \"${params.GREP.trim()}\""

          } else if (params.SUITE != 'all') {

            cmd += " --grep @${params.SUITE}"
          }

          echo "Command: ${cmd}"

          bat cmd
        }
      }
    }
  }

  // ── Post Actions ───────────────────────────────────────────
  post {

    always {

      echo '================================================'
      echo 'Publishing reports and archiving artifacts'
      echo '================================================'

      // JUnit XML Report
      junit(
        testResults: 'reports/junit/results.xml',
        allowEmptyResults: true
      )

      // Custom HTML Report
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'reports/custom-report',
        reportFiles: 'summary.html',
        reportName: 'Playwright Custom Report'
      ])

      // Playwright HTML Report
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'reports/html-report',
        reportFiles: 'index.html',
        reportName: 'Playwright HTML Report'
      ])

      // Archive artifacts
      archiveArtifacts(
        artifacts: 'test-results/**/*,reports/json-report/results.json',
        allowEmptyArchive: true,
        fingerprint: true
      )
    }

    success {

      echo 'BUILD PASSED - All tests completed successfully.'
    }

    failure {

      echo 'BUILD FAILED - Check Playwright reports above.'
    }

    unstable {

      echo 'BUILD UNSTABLE - Some tests failed after retries.'
    }
  }
}