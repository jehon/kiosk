pipeline {
  agent any
  options {
    ansiColor('xterm')
    lock resource: 'port_kiosk'
    skipStagesAfterUnstable()
    disableConcurrentBuilds()
    timeout(time: 60, unit: 'MINUTES')
  }
  stages {
    stage('setup-computer-test') {
      steps {
        sh 'make setup-computer-test'
      }
    }

    stage('dump') {
      steps {
        sh 'make dump'
      }
    }
    stage('dependencies') {
      steps {
        sh '''
set -e
npm ci
touch node_modules/.dependencies
make dependencies
'''
      }
    }

    stage('test') {
      steps {
        sh 'make test'
      }
    }

    stage('lint') {
      steps {
        sh 'make lint'
      }
    }
  }
}