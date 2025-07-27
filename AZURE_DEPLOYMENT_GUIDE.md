# Azure Static Web Apps Deployment Fix Guide

## Problem: "deployment_token was not provided"

This error occurs when the Azure Static Web Apps deployment token is missing, incorrect, or expired.

## Solution Steps

### 1. ✅ Create/Verify Azure Static Web App Resource

1. **Go to Azure Portal** → Create a resource → Static Web Apps
2. **Configure the resource**:
   - **Subscription**: Your Azure subscription  
   - **Resource Group**: Create new or use existing
   - **Name**: `snackspot-auckland-frontend`
   - **Plan type**: Free
   - **Region**: East Asia or Australia East (closest to Auckland)
   - **Source**: GitHub
   - **GitHub account**: Link your GitHub account
   - **Organization**: Your GitHub username
   - **Repository**: `Snackwork` (your repo name)
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `src/frontend`
   - **Api location**: (leave empty)
   - **Output location**: `dist`

### 2. 🔑 Get the Deployment Token

1. **After creation**, go to your Static Web App resource in Azure Portal
2. **Navigate**: Overview → Manage deployment token
3. **Copy the deployment token** (starts with something like `swa-`)

### 3. 🔐 Update GitHub Repository Secret

1. **Go to your GitHub repository**
2. **Settings** → Secrets and variables → Actions
3. **Update or create** repository secret:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: Paste the deployment token from step 2

### 4. 🛠️ Alternative: Recreate the Resource

If the above doesn't work, the Azure resource might be corrupted:

1. **Delete** the existing Static Web App resource
2. **Create a new one** following step 1
3. **Update the secret** with the new deployment token

### 5. 📝 Update Workflow (if needed)

Your current workflow is correct, but ensure these settings match:

```yaml
app_location: "src/frontend"     # ✅ Correct
api_location: ""                 # ✅ Correct (no backend API)  
output_location: "dist"          # ✅ Correct
```

### 6. 🚀 Trigger Deployment

1. **Make a small change** to your frontend code
2. **Commit and push** to main branch
3. **Check GitHub Actions** tab for successful deployment

## Troubleshooting Checklist

- [ ] Azure Static Web App resource exists and is active
- [ ] Deployment token is copied correctly (no extra spaces)
- [ ] GitHub secret name is exactly `AZURE_STATIC_WEB_APPS_API_TOKEN`
- [ ] Repository has access to the secret
- [ ] Build settings match your project structure
- [ ] No typos in workflow file paths

## Common Issues

### Issue: "Resource not found"
**Solution**: The Azure resource was deleted or doesn't exist. Create it again.

### Issue: "Invalid deployment token"  
**Solution**: Token might be expired. Generate a new one from Azure Portal.

### Issue: "Build failed"
**Solution**: Check build logs. Usually Node.js version or dependency issues.

## Verification

After successful deployment, you should see:
- ✅ Green checkmark in GitHub Actions
- ✅ Your app accessible at the Azure Static Web Apps URL
- ✅ Automatic builds on future commits

## Need Help?

If you're still having issues:
1. Check the full GitHub Actions logs
2. Verify Azure resource is in "Ready" state
3. Ensure your Azure subscription is active
4. Try creating the resource in a different region 