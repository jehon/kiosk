pipeline {
  agent any
  options {
    ansiColor('xterm')
    lock resource: 'port_kiosk'
    skipStagesAfterUnstable()
    disableConcurrentBuilds()
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
    stage('test-server') {
      steps {
        sh 'make test-server'
      }
    }
    stage('test-client') {
      steps {
        sh 'make test-client'
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