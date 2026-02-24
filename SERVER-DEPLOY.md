# Host Artihcus Backend on Your Server

Follow these steps in order. Your server: **97.77.20.150**. MongoDB is already running there in Docker.

---

## Step 1: Build the Docker image (on your PC)

From your project root:

```bash
cd backend
docker build -t artihcus/artihcus-global-backend:latest .
```

If you use Docker Hub and want to push:

```bash
docker login
docker push artihcus/artihcus-global-backend:latest
```

If you **don’t** use Docker Hub, you can copy the image to the server (Step 3) or build on the server (see Step 3 alternative).

---

## Step 2: Create app folder and .env on the server

SSH in:

```bash
ssh root@97.77.20.150
```

Create directory and uploads folder:

```bash
mkdir -p /data/apps/artihcus-global/uploads
```

Create the env file (use nano or vi):

```bash
nano /data/apps/artihcus-global/.env
```

Paste this and **edit** the values (email, password, MongoDB password with `@` as `%40`):

```env
PORT=5000
EMAIL_USER=groupartihcus@gmail.com
EMAIL_PASS=your-app-password
MONGODB_URI=mongodb://artihcus_global:Artihcus%40123@mongodb:27017/artihcus_global?authSource=artihcus_global
```

Save and exit (in nano: Ctrl+O, Enter, Ctrl+X).

---

## Step 3: Get the image on the server

**Option A – You pushed to Docker Hub**

On the server:

```bash
docker pull artihcus/artihcus-global-backend:latest
```

**Option B – Build on the server**

Copy the whole `backend` folder to the server (e.g. with scp or Git), then on the server:

```bash
cd /path/to/backend
docker build -t artihcus/artihcus-global-backend:latest .
```

**Option C – Save/load image (no Docker Hub)**

On your PC:

```bash
docker save artihcus/artihcus-global-backend:latest -o artihcus-backend.tar
scp artihcus-backend.tar root@97.77.20.150:/data/apps/artihcus-global/
```

On the server:

```bash
docker load -i /data/apps/artihcus-global/artihcus-backend.tar
```

---

## Step 4: Run the backend container

On the server, run (use the same `MONGODB_URI` hostname `mongodb` and network `mongo_default`):

```bash
docker run -d \
  --name artihcus-global-backend \
  --restart unless-stopped \
  --network mongo_default \
  -p 5001:5000 \
  --env-file /data/apps/artihcus-global/.env \
  -v /data/apps/artihcus-global/uploads:/app/uploads \
  artihcus/artihcus-global-backend:latest
```

- **5001** = port on the server (so backend is `http://97.77.20.150:5001`).
- **mongo_default** = Docker network where your `mongodb` container runs.
- **uploads** = files saved under `/data/apps/artihcus-global/uploads`.

---

## Step 5: Check that it’s running

```bash
docker ps
docker logs -f artihcus-global-backend
```

You should see “Server running on port 5000” and “MongoDB connected”. Stop following logs with Ctrl+C.

Test from your PC:

```bash
curl http://97.77.20.150:5001/api/events
```

You should get `[]` or a JSON array.

---

## Step 6: Point frontend to this backend

When building the frontend for production, set the API URL and build:

**PowerShell (Windows):**

```powershell
cd frontend
$env:REACT_APP_API_URL="http://97.77.20.150:5001"
npm run build
```

**Linux/Mac:**

```bash
cd frontend
REACT_APP_API_URL=http://97.77.20.150:5001 npm run build
```

Deploy the `frontend/build` folder to your web server. The site will call `http://97.77.20.150:5001` for API and uploads.

---

## Useful commands on the server

| What              | Command |
|-------------------|--------|
| Logs              | `docker logs -f artihcus-global-backend` |
| Restart           | `docker restart artihcus-global-backend` |
| Stop              | `docker stop artihcus-global-backend` |
| Start again       | `docker start artihcus-global-backend` |
| Remove container  | `docker stop artihcus-global-backend` then `docker rm artihcus-global-backend` |

---

## If MongoDB password has `@`

In `MONGODB_URI`, encode `@` in the password as `%40`.  
Example: password `Artihcus@123` → `Artihcus%40123` in the URI.
