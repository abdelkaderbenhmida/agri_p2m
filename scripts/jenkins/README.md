Jenkins setup helper scripts for the Agri project

Overview
--------
Files in this folder help bootstrap a Jenkins controller to run the project's `Jenkinsfile`.

Files
-----
- `plugins.txt`: list of Jenkins plugin short names to install.
- `install-plugins.sh`: helper script to copy `plugins.txt` into a running Jenkins container and invoke `jenkins-plugin-cli`.
- `create-credentials.groovy`: Groovy script to create Jenkins credentials (username/password and file). Edit and run via Script Console or `jenkins-cli`.
- `seed-multibranch.groovy`: Job DSL script to create a Multibranch Pipeline job (edit repository details before running from a seed job).

Quick steps
-----------
1. Start Jenkins (container or host). Ensure `jenkins-plugin-cli` is available (official Jenkins images include it).
2. Install plugins using `install-plugins.sh`:

```bash
cd scripts/jenkins
./install-plugins.sh <jenkins-container-name>
```

3. Create credentials:
- For Docker registry: create a Username/Password credential with id `docker-registry-credentials`.
- For kubeconfig: create a File credential with id `kubeconfig` containing your kubeconfig file.

You can create these from the Jenkins UI or run `create-credentials.groovy` via the Script Console.

4. Create the Multibranch Pipeline:
- Install the Job DSL plugin and create a seed job that runs `seed-multibranch.groovy` (edit the script to set repo owner and repo name), or create a Multibranch Pipeline job via UI that points to your Git repo.

5. Ensure build agents have Docker/Maven/Node/kubectl installed.

If you want, I can:
- Generate a Job DSL seed job XML for direct import.
- Attempt to run `jenkinsfile-runner` locally using a compatible WAR and pre-downloaded plugin files.
- Create a scripted Groovy job to auto-create credentials (you'll need to provide secret values here).

