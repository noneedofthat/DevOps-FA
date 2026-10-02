# Hackathon & Tech Event Management Portal

**TenzorX 2026** - A highly scalable, cloud-native web application designed to streamline the lifecycle of technical competitions, from event discovery to final submissions and real-time leaderboards.

## 🚀 Tech Stack

### Frontend & Client Architecture
- **Framework:** Next.js (React) utilizing the App Router.
- **Styling:** Tailwind CSS (Strict monochromatic `slate` palette with `blue` accents).
- **Validation:** React Hook Form + Zod (Strict emoji prohibition & repository URL validation).
- **Deployment:** Vercel (Edge caching & CDN delivery).

### Backend & Real-Time Data
- **API Server:** Node.js & Express (TypeScript).
- **Database & Sync:** Firebase Cloud Firestore (Real-time WebSockets).
- **Authentication:** Firebase Auth (Session management & anonymous logins).
- **File Uploads:** Multer (Memory storage handling).

### DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose.
- **IaC (Infrastructure as Code):** Terraform (AWS VPC & EC2 Provisioning).
- **Configuration Management:** Ansible (Nginx & Docker setup).
- **CI/CD:** GitHub Actions (Automated linting, strict Emoji PR rejection, and build pipelines).

---

## 📂 Project Structure

```
.
├── backend/                  # Node.js/Express backend API
│   ├── src/                  # API routes (Invite logic, File Uploads)
│   ├── Dockerfile            # Backend container definition
│   └── tsconfig.json
├── src/
│   ├── app/                  # Next.js Frontend Pages
│   │   ├── page.tsx          # Page 1: Event Discovery
│   │   ├── team/             # Page 2: Team Formation Workspace
│   │   ├── submit/           # Page 3: Submission Gateway
│   │   └── leaderboard/      # Page 4: Live Leaderboard
│   ├── context/              # Firebase Authentication Context
│   └── lib/                  # Firebase Initialization
├── terraform/                # AWS infrastructure provisioning files
├── ansible/                  # Server configuration playbooks
├── .github/workflows/        # CI/CD Pipeline definitions
├── Dockerfile                # Frontend Next.js container definition
└── docker-compose.yml        # Local development orchestration
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Terraform CLI (For AWS deployment)
- Ansible (For server configuration)

### Local Development (Without Docker)

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```
2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```
3. **Set Environment Variables:**
   Create a `.env.local` file in the root directory containing your Firebase credentials.
4. **Run the Backend Server:**
   ```bash
   cd backend
   npx ts-node src/index.ts
   ```
5. **Run the Frontend Server:**
   ```bash
   npm run dev
   ```

### Local Development (With Docker)
To spin up both the frontend and backend simultaneously in isolated containers:
```bash
docker-compose up --build
```

---

## ☁️ DevOps & Deployment

### 1. Infrastructure Provisioning (Terraform)
Navigate to the `terraform/` directory and apply the AWS configuration to spin up the EC2 instance and Security Groups.
```bash
cd terraform
terraform init
terraform apply
```

### 2. Server Configuration (Ansible)
Run the Ansible playbook against your newly provisioned EC2 instance IP to install Docker and configure Nginx as a reverse proxy.
```bash
cd ansible
ansible-playbook -i "YOUR_EC2_IP," playbook.yml
```

### 3. Continuous Integration
All Pull Requests are automatically validated by GitHub Actions. **Note:** Any PR containing emojis in the codebase will automatically fail the pipeline due to strict UI constraints.

---
*Lead Developer: Sahil Kasture*
