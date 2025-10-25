# Environment Variables Setup for Utho VM Deployment

## Google Sheets Credentials

The `GOOGLE_CREDENTIALS` environment variable needs to be set in your deployment platform (Utho VM) with the full Google Cloud Service Account JSON credentials.

### Steps to Set Up:

1. **Get your Google Cloud Service Account credentials** from the Google Cloud Console
2. **In Utho VM Environment:**
   - Set the `GOOGLE_CREDENTIALS` environment variable in your `.env` file
   - Add the full JSON credentials as the value
   - Ensure proper escaping of quotes and newlines

### Example Format:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## Alternative: JSON File Method

Instead of environment variables, you can also place the JSON file directly in the backend directory:
- File: `backend/mangatrai-6bc45a711bae.json`
- The application will automatically detect and use this file

## Security Note

- Never commit credentials to version control
- Use environment variables for all sensitive data
- The application now uses the JSON file method for better security


