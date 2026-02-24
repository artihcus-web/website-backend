# CI/CD for Artihcus Global

## Workflows

- **build.yml** – On every push/PR to `main`: install backend deps and verify `server.js` syntax.
- **deploy.yml** – On push to `main`: build backend Docker image, push to Docker Hub, then SSH to the server and deploy.

## Required GitHub secrets

Add these in the repo: **Settings → Secrets and variables → Actions**.

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username (e.g. `artihcusweb`) |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `SSH_HOST` | Server IP (e.g. `97.77.20.150`) |
| `SSH_USERNAME` | SSH user (e.g. `root`) |
| `SSH_PRIVATE_KEY` | Full contents of the private key used to SSH into the server |

## Server setup (one-time)

1. Create `/data/apps/artihcus-global/.env` on the server with `PORT`, `EMAIL_USER`, `EMAIL_PASS`, `MONGODB_URI`.
2. Ensure the server has Docker and the backend can use the `mongo_default` network (same as your `mongodb` container).
3. Use an SSH key that has access to the server; put the **private** key in `SSH_PRIVATE_KEY`.

## Docker Hub

- Create a repo (e.g. `artihcus-global-backend`) or use automatic creation on first push.
- Prefer a [Docker Hub access token](https://hub.docker.com/settings/security) instead of your account password for `DOCKER_PASSWORD`.
