import jenkins.model.*
import java.io.ByteArrayInputStream

def repoRoot = System.getenv('REPO_ROOT') ?: '/var/jenkins_home'
def jobXmlPath = "${repoRoot}/scripts/jenkins/agri-local-job.xml"
def jobName = 'agri-local'
def jenkins = Jenkins.get()

def file = new File(jobXmlPath)
if (file.exists()) {
  def xml = file.getBytes()
  try {
    def job = jenkins.getItem(jobName)
    if (job == null) {
      jenkins.createProjectFromXML(jobName, new ByteArrayInputStream(xml))
      println "Created job ${jobName} from ${jobXmlPath}"
      jenkins.getItem(jobName)?.scheduleBuild2(0)
    } else {
      job.updateByXml(new ByteArrayInputStream(xml))
      job.save()
      println "Updated job ${jobName} from ${jobXmlPath}"
      job.scheduleBuild2(0)
    }
  } catch(Exception e) {
    println "Failed to create job: ${e}." 
    e.printStackTrace()
  }
} else {
  println "Job XML not found at ${jobXmlPath}"
}
