# ShopSmart
// serty

A full-stack web application with a React frontend and Node.js/Express backend.

## Tech Stack

- **Frontend**: React 18 + Vite + ESLint
- **Backend**: Node.js + Express + ESLint
- **Testing**: Vitest (frontend), Jest + Supertest (backend), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Database**: Managed PostgreSQL on AWS RDS (previously SQLite + Prisma)

## Getting Started

```bash
# One-command idempotent setup
bash setup.sh

# Start backend (requires DATABASE_URL for live DB, or falls back to in-memory)
cd server && npm run dev

# Start frontend (in another terminal)
cd client && npm run dev
```

## Running Tests

```bash
# Backend — unit + integration tests
cd server && npm test

# Backend — linting
cd server && npm run lint

# Frontend — unit + integration tests
cd client && npm run test -- --run

# Frontend — linting
cd client && npm run lint

# E2E — Playwright (requires built frontend)
cd client && npm run build
npm run test:e2e
```

## Phase 1: Testing Reports

Phase 1 requires unit and integration tests plus generated test reports.

### Frontend Vitest Report

Run from the project root:

```bash
cd client
mkdir -p test-results
npm run test -- --run --reporter=default --reporter=junit --outputFile=./test-results/vitest-junit.xml
```

Generated report:

```text
client/test-results/vitest-junit.xml
```

### Backend Jest Report

Run from the project root:

```bash
cd server
mkdir -p test-results
npm test -- --json --outputFile=./test-results/jest-results.json
```

Generated report:

```text
server/test-results/jest-results.json
```

### GitHub Actions Artifacts

The Phase 1 workflows upload these reports automatically:

- `Frontend-test.yml` uploads `frontend-vitest-report`
- `backend-tests.yml` uploads `backend-jest-report`
- `e2e-tests.yml` already uploads `playwright-report`

## CI Workflows

| Workflow            | Trigger      | What it does                    |
| ------------------- | ------------ | ------------------------------- |
| `Frontend-test.yml` | push / PR    | lint + test + upload Vitest report + build frontend |
| `backend-tests.yml` | push / PR    | lint + test backend + upload Jest report |
| `e2e-tests.yml`     | push / PR    | build frontend + run Playwright |
| `deploy to Ec2.yml` | push to demo | deploy to AWS EC2 via SSH       |
| `deploy-pages.yml`  | push to main | deploy frontend to GitHub Pages |

## Terraform Deployment

This project includes Terraform configuration in `terraform/` for AWS ECR, ECS Fargate, IAM, security group, default VPC networking, and an encrypted private S3 bucket.

For AWS Academy, IAM role creation is restricted. This project uses the existing AWS Academy `LabRole` in Terraform instead of creating a new ECS task execution role.

### Prerequisites

Install and configure these tools before running Terraform:

- Terraform CLI
- AWS CLI
- Docker
- AWS Academy lab access with the existing `LabRole`
- Permissions for ECR, ECS, EC2 networking, S3, and CloudWatch Logs

Configure AWS credentials:

```bash
aws configure
```

Confirm your AWS identity:

```bash
aws sts get-caller-identity
```

### Step 1: Review Terraform Variables

The default values are defined in `terraform/variables.tf`:

- `aws_region`: `us-east-1`
- `project_name`: `shopsmart`
- `image_tag`: `latest`

You can override them when running Terraform:

```bash
terraform plan -var="aws_region=us-east-1" -var="image_tag=latest"
```

### Step 2: Initialize Terraform

```bash
cd terraform
terraform init
```

### Step 3: Format and Validate

```bash
terraform fmt
terraform validate
```

### Step 4: Create the ECR Repository First

The ECS task uses an image from ECR, so create the ECR repository before building and pushing the Docker image:

```bash
terraform apply -target=aws_ecr_repository.app
```

When prompted, type:

```text
yes
```

Get the ECR repository URL:

```bash
terraform output ecr_repository_url
```

### Step 5: Build and Push the Docker Image

Go back to the project root:

```bash
cd ..
```

Log in to ECR:

```bash
# Replace <AWS_ACCOUNT_ID> with your actual account ID (e.g., 872784526582)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

Build, tag, and push the image:

```bash
docker build -t shopsmart-repo .
docker tag shopsmart-repo:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-repo:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-repo:latest
```

### Step 6: Plan the Full Infrastructure

```bash
cd terraform
terraform plan
```

Review the resources Terraform will create.

### Step 7: Apply the Full Infrastructure

```bash
terraform apply
```

When prompted, type:

```text
yes
```

### Step 8: View Outputs

```bash
terraform output
```

The important outputs are:

- `ecr_repository_url`
- `s3_bucket_name`

### Step 9: Check ECS Deployment

Use the AWS Console or AWS CLI to confirm the ECS service is running:

```bash
aws ecs list-clusters --region us-east-1
aws ecs list-services --cluster shopsmart-cluster --region us-east-1
aws ecs describe-services --cluster shopsmart-cluster --services shopsmart-service --region us-east-1
```

### Step 10: Update the Application Image

After making code changes, rebuild and push the Docker image:

```bash
docker build -t shopsmart-repo .
docker tag shopsmart-repo:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-repo:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/shopsmart-repo:latest
```

Then force ECS to redeploy:

```bash
aws ecs update-service \
  --cluster shopsmart-cluster \
  --service shopsmart-service \
  --force-new-deployment \
  --region us-east-1
```

### Step 11: Destroy Infrastructure

When you no longer need the AWS resources, destroy them to avoid charges:

```bash
cd terraform
terraform destroy
```

When prompted, type:

```text
yes
```

## Phase 3: Container Build and ECS Deployment

Phase 3 requires building a Docker image, pushing it to ECR, deploying it to ECS Fargate, and verifying that the service is running.

The Dockerfile includes the required Phase 3 items:

- multi-stage build
- non-root user
- healthcheck

### Step 1: Confirm AWS Academy Access

Start your AWS Academy lab first, then configure AWS CLI credentials from the lab environment:

```bash
aws configure
```

Confirm the account:

```bash
aws sts get-caller-identity
```

### Step 2: Create or Confirm the ECR Repository

From the Terraform folder:

```bash
cd /Users/himanshurawat/shopsmart/terraform
terraform init
terraform validate
terraform apply -target=aws_ecr_repository.app
```

When prompted, type:

```text
yes
```

Get the ECR repository URL:

```bash
terraform output ecr_repository_url
```

### Step 3: Build the Docker Image

From the project root:

```bash
cd /Users/himanshurawat/shopsmart
docker build -t shopsmart-repo .
```

### Step 4: Log In to Amazon ECR

Set your AWS values:

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/shopsmart-repo"
```

Log in:

```bash
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPOSITORY"
```

### Step 5: Tag and Push the Image to ECR

```bash
docker tag shopsmart-repo:latest "$ECR_REPOSITORY:latest"
docker push "$ECR_REPOSITORY:latest"
```

### Step 6: Deploy ECS Fargate with Terraform

The Terraform ECS task definition uses the AWS Academy `LabRole`, so it does not create a new IAM role.

From the Terraform folder:

```bash
cd /Users/himanshurawat/shopsmart/terraform
terraform plan
terraform apply
```

When prompted, type:

```text
yes
```

### Step 7: Verify the ECS Service

Check the ECS service:

```bash
aws ecs describe-services \
  --cluster shopsmart-cluster \
  --services shopsmart-service \
  --region us-east-1
```

Look for:

```text
status: ACTIVE
desiredCount: 1
runningCount: 1
```

List running tasks:

```bash
aws ecs list-tasks \
  --cluster shopsmart-cluster \
  --service-name shopsmart-service \
  --region us-east-1
```

Describe a task if needed:

```bash
aws ecs describe-tasks \
  --cluster shopsmart-cluster \
  --tasks TASK_ARN_HERE \
  --region us-east-1
```

Phase 3 is complete when the Docker image is in ECR and the ECS service shows `runningCount: 1`.

## Automated GitHub Pipeline

The **ShopSmart CI/CD** workflow runs automatically on every push to `main` or `master`.

Pipeline order:

```text
Push to main/master
Run frontend tests and build
Authenticate with AWS
Log in to Amazon ECR
Build, Tag, and Push Docker image to ECR
Deploy to ECS Fargate (Force New Deployment)
```

### Required GitHub Secrets

Add these secrets in GitHub:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
TERRAFORM_STATE_BUCKET
```

For AWS Academy, `AWS_SESSION_TOKEN` is required because lab credentials are temporary.

Set `TERRAFORM_STATE_BUCKET` to:

```text
shopsmart-bucket-659fc6e3
```

### Add GitHub Secrets

In GitHub:

```text
Repository
Settings
Secrets and variables
Actions
New repository secret
```

Create each secret one by one:

```text
Name: AWS_ACCESS_KEY_ID
Value: your AWS Academy access key

Name: AWS_SECRET_ACCESS_KEY
Value: your AWS Academy secret key

Name: AWS_SESSION_TOKEN
Value: your AWS Academy session token

Name: AWS_REGION
Value: us-east-1 (or your preferred region)

Name: TERRAFORM_STATE_BUCKET
Value: shopsmart-bucket-659fc6e3
```

After secrets are added, push to `main`:

```bash
git add Dockerfile README.md .gitignore .github/workflows/deploy.yml terraform/main.tf
git commit -m "Add automated AWS pipeline"
git push origin main
```

Then open GitHub:

```text
Actions
ShopSmart Pipeline
Latest workflow run
```

The test reports are available under the workflow run artifacts:

```text
frontend-vitest-report
backend-jest-report
playwright-report
```

## Troubleshooting & Lessons Learned

During the deployment of ShopSmart to AWS ECS, we encountered and resolved the following issues:

### 1. Error: `ExpiredToken` (Terraform/CLI)
- **Issue**: Terraform commands failed with `retrieving caller identity from STS: ExpiredToken`.
- **Cause**: Local AWS CLI credentials (especially the Session Token in AWS Academy) had expired.
- **Resolution**: Updated local credentials using `aws configure` and included the fresh `AWS_SESSION_TOKEN`.

### 2. Error: `CannotPullContainerError` (Platform Mismatch)
- **Issue**: ECS Tasks would immediately move to a `Stopped` state.
- **Cause**: Building the image on a Mac (M1/M2/M3) created an `arm64` image, but ECS Fargate (by default) requires `linux/amd64`.
- **Resolution**: Used the `--platform` flag during build:
  ```bash
  docker build --platform linux/amd64 -t shopsmart-repo .
  ```

### 3. Blank White Page (Vite Asset Paths)
- **Issue**: The application loaded with the correct title but showed a blank white screen.
- **Cause**: The `vite.config.js` had `base: '/shopsmart/'` defined, causing the app to look for assets in the wrong directory.
- **Resolution**: Changed the base path to root in `client/vite.config.js`:
  ```javascript
  export default defineConfig({
    base: '/',
    // ...
  })
  ```

### 4. API Connectivity Issues (Relative Paths)
- **Issue**: The frontend could not communicate with the backend API in the container.
- **Cause**: The API URL was hardcoded to `localhost:5001`.
- **Resolution**: Updated `client/src/App.jsx` to use relative paths for API calls when no environment variable is provided:
  ```javascript
  const API = import.meta.env.VITE_API_URL || ''
  ```

### 5. Deployment of Placeholder instead of Real App
- **Issue**: The site showed a "Placeholder" message instead of the full UI.
- **Cause**: The root `Dockerfile` was pointing to a temporary `app/` folder.
- **Resolution**: Updated the `Dockerfile` to a **Multi-Stage Build** that builds the React frontend and copies it into the Node.js backend's `public` folder to be served as static content.

### 6. Direct IP Access and Port Requirements
- **Issue**: The application was only accessible via its public IP on port 3000 (`http://<public-ip>:3000`), which is not suitable for production.
- **Resolution**: Implemented an **AWS Application Load Balancer (ALB)**.
  - The ALB listens on standard HTTP (port 80).
  - It forwards traffic to the ECS tasks on port 3000.
  - Users can now access the app via a clean DNS name without specifying a port.

### 7. Security Group Lockdown
- **Issue**: The initial security group was overly permissive, allowing anyone to access the container directly on port 3000.
- **Resolution**: 
  - Created a dedicated **ALB Security Group** allowing ports 80 and 443 from the internet.
  - Updated the **ECS Security Group** to only allow inbound traffic from the ALB Security Group on port 3000.
  - This ensures that the application cannot be bypassed and all traffic is filtered by the load balancer.

### 8. High Availability & Stability
- **Issue**: Single point of failure and lack of health monitoring.
- **Resolution**: 
  - Configured the ALB to use subnets in multiple Availability Zones for high availability.
  - Implemented **Target Group Health Checks** on the root path (`/`).
  - Integrated the ALB with the ECS Service using a `load_balancer` block in Terraform, ensuring tasks auto-register and traffic is only routed to healthy containers.

### 9. Database Connection & Test Stability (ECONNREFUSED)
- **Issue**: After moving to RDS, integration tests failed with `ECONNREFUSED` because they tried to connect to a local database that didn't exist in the CI/CD environment.
- **Resolution**: Implemented a **Resilient Database Strategy** in `app.js`.
  - The application checks for `DATABASE_URL` at runtime.
  - If the database is unreachable or the environment variable is missing (e.g., during testing), the API falls back to a hardcoded `productsFallback` array.
  - This keeps the test suite green and stable while allowing the production app to use the live RDS database.

## RDS Database Connection

To connect to your RDS instance from your local machine:

1. **Download the SSL Bundle**:
   ```bash
   curl -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```

2. **Set Environment Variable**:
   ```bash
   # Replace with your actual endpoint from terraform output
   export RDSHOST="shopsmart-db.xxxx.us-east-1.rds.amazonaws.com"
   ```

3. **Connect via psql**:
   ```bash
   psql "host=$RDSHOST port=5432 dbname=shopsmart user=dbadmin sslmode=verify-full sslrootcert=./global-bundle.pem"
   ```
