# Local Development Setup

To run this project locally, follow these steps:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables (.env)**:
   - Create a file named **`.env`** (no extension) in the root directory.
   - Copy the contents from **`.env.example`** into it.
   - Replace `MY_GEMINI_API_KEY` with your actual key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - This key is required for the AI Review system to function locally.

3. **Authorized Domains (CRITICAL for Login)**:
   Because this project uses Google Authentication, you must authorize `localhost` in your Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select your project.
   - Navigate to **Authentication** > **Settings** > **Authorized domains**.
   - Add `localhost` and `127.0.0.1` to the list.
   - Ensure the port in the browser matches your development server (default is `3000`).

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Troubleshooting

- **"API Key must be set" Error**: 
  Make sure you have created the `.env` file correctly as described in step 2. If you just added the file, restart your development server (`Ctrl+C` then `npm run dev`).
- **Popup closes immediately during login**: 
  This is usually due to the domain not being authorized (see step 3).
- **Firestore permission errors**: 
  Ensure your Firestore Rules are deployed and that you are signed in. Some data might be restricted to specific roles.
- **New user setup shown instead of dashboard**: 
  If you are using a different Firebase project locally, your profile data won't exist there. Check `firebase-applet-config.json`.
