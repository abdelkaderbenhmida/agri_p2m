// Job DSL script to create a Multibranch Pipeline. Run this from the Jenkins Job DSL seed job.
// Replace REPO_URL with your repository URL and CREDENTIALS_ID with SCM credentials if needed.
multibranchPipelineJob('agri-multibranch') {
  description('Multibranch pipeline for the Agri project. Uses the Jenkinsfile in the repo root.')
  branchSources {
    github {
      id('agri-github')
      repoOwner('REPLACE_WITH_OWNER')
      repository('REPLACE_WITH_REPO')
      credentialsId('')
      configuredByUrl(false)
    }
  }
  orphanedItemStrategy {
    discardOldItems {
      daysToKeep(30)
      numToKeep(20)
    }
  }
  triggers {
    periodic(1)
  }
}
println 'Seed script executed. Edit the script to set repo owner/repo.'
