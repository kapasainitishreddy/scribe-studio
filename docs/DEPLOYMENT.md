# Deployment Guide

## Cloud Run Backend
To deploy the Google ADK + Parallel Search backend to Cloud Run:
1. Add GCP_SA_KEY and GCP_PROJECT_ID secrets to your GitHub repository.
2. Create Secret Manager secrets in GCP for PARALLEL_API_KEY and GEMINI_API_KEY.
3. The GitHub Action will automatically deploy and output the URL.

## Frontend Configuration
Once deployed, set the VITE_AGENT_API_BASE_URL GitHub Actions variable or .env.production variable to the Cloud Run URL so the frontend connects successfully.
