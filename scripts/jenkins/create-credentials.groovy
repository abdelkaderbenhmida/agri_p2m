// Usage: copy this to Jenkins Script Console or run via `jenkins-cli groovy`.
import jenkins.model.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import com.cloudbees.plugins.credentials.common.*
import hudson.util.Secret
import java.nio.file.Files

def store = Jenkins.instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

def createUserPass(id, username, password, description) {
  def c = new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL, id, description, username, password)
  store.addCredentials(Domain.global(), c)
  println "Created credentials: ${id}"
}

def createFileCred(id, filePath, description) {
  def bytes = Files.readAllBytes(new File(filePath).toPath())
  def secretBytes = new hudson.util.Secret(bytes)
  // Use FileCredentialsImpl if plugin available
  try {
    def c = new org.jenkinsci.plugins.plaincredentials.impl.FileCredentialsImpl(CredentialsScope.GLOBAL, id, description, null, bytes)
    store.addCredentials(Domain.global(), c)
    println "Created file credential: ${id}"
  } catch(Exception e) {
    println "Failed to create FileCredentialsImpl - ensure Plain Credentials plugin is installed: ${e.message}"
  }
}

// Replace the placeholders below when running
// createUserPass('docker-registry-credentials', 'dockeruser', 'dockerpass', 'Registry credentials for docker login')
// createFileCred('kubeconfig', '/absolute/path/to/kubeconfig', 'Kubeconfig file for kubectl')

println 'Edit and run this script with your values.'
