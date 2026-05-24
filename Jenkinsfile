// ============================================================
// Jenkinsfile — Playwright AI Framework
// OS        : Windows (uses bat blocks)
// Browser   : Chromium only
// Workers   : 4
// Jenkins   : http://localhost:8080
// Repo      : https://github.com/deven037/playwright_ai.git
//
// Credentials Strategy:
// Reads .env from local machine and copies into Jenkins workspace
// ============================================================

pipeline {
    agent any

    // ── Parameters ─────────────────────────────────────────────
    parameters {
        choice(
            name: 'SUITE',
            choices: ['regression', 'smoke', 'sanity', 'feature', 'e2e', 'all'],
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

        NODE_HOME = 'C:\\Program Files\\nodejs'

        PATH = "C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;${env.PATH}"
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
        // ── Checkout ───────────────────────────────────────────
        stage('Checkout') {
      steps {
        echo '================================================'
        echo 'Checking out source code from GitHub'
        echo '================================================'

        checkout scm

        bat 'git log --oneline -1'
      }
        }

        // ── Load .env ──────────────────────────────────────────
        stage('Load .env') {
      steps {
        echo '================================================'
        echo 'Loading credentials from local .env file'
        echo '================================================'

        bat '''
                    if not exist "C:\\Users\\user\\Desktop\\playwright_ai\\.env" (
                        echo .env file not found
                        exit /b 1
                    )

                    copy "C:\\Users\\user\\Desktop\\playwright_ai\\.env" ".env"

                    echo .env copied successfully
                '''
      }
        }

        // ── Verify Tools ───────────────────────────────────────
        stage('Verify Tools') {
      steps {
        echo '================================================'
        echo 'Verifying Node.js and npm versions'
        echo '================================================'

        bat 'node --version'

        bat 'npm --version'
      }
        }

        // ── Install Dependencies ───────────────────────────────
        stage('Install Dependencies') {
      steps {
        echo '================================================'
        echo 'Installing npm dependencies'
        echo '================================================'

        bat 'npm ci'
      }
        }

        // ── Install Browsers ───────────────────────────────────
        stage('Install Browsers') {
      steps {
        echo '================================================'
        echo 'Installing Playwright Chromium browser'
        echo '================================================'

        bat 'npx playwright install chromium'
      }
        }

        // ── Clean Reports ──────────────────────────────────────
        stage('Clean Reports') {
      when {
        expression {
          return params.CLEAN_REPORTS == true
        }
      }

      steps {
        echo '================================================'
        echo 'Cleaning previous reports and test-results'
        echo '================================================'

        bat 'if exist test-results rmdir /s /q test-results'

        bat 'if exist reports rmdir /s /q reports'

        bat 'if exist logs rmdir /s /q logs'

        bat 'if exist auth rmdir /s /q auth'
      }
        }

        // ── Run Tests ──────────────────────────────────────────
        stage('Run Tests') {
      steps {
        echo '================================================'
        echo "Suite  : ${params.SUITE}"
        echo "Spec   : ${params.SPEC ?: '(all)'}"
        echo "Grep   : ${params.GREP ?: '(none)'}"
        echo '================================================'

        script {
          def cmd = 'npx playwright test --project=chromium --workers=4'

          // Specific spec file
          if (params.SPEC?.trim()) {
            cmd += " ${params.SPEC.trim()}"
          }

          // Grep filter
          if (params.GREP?.trim()) {
            cmd += " --grep \"${params.GREP.trim()}\""
                    } else if (params.SUITE != 'all') {
            cmd += " --grep @${params.SUITE}"
          }

          echo "Executing Command: ${cmd}"

          bat cmd
        }
      }
        }
    }

    // ── Post Actions ──────────────────────────────────────────
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

      // Playwright HTML Report
      publishHTML([
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                alwaysLinkToLastBuild: true,
                allowMissing: true
            ])

      // Custom HTML Report
      publishHTML(target: [
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                alwaysLinkToLastBuild: true,
                allowMissing: false
])

      // Archive Reports & Artifacts
      archiveArtifacts(
                artifacts: 'reports/**,test-results/**',
                fingerprint: true,
                allowEmptyArchive: true
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
