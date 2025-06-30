# **App Name**: AnonLink

## Core Features:

- Anonymous Token Generation: Generate a UUID V4 token for anonymous users and store it in local storage, allowing persistent identification across sessions.
- Frictionless URL Shortening: Allow users to shorten URLs without creating an account.
- Creator Device Fingerprinting: Capture the device fingerprint when creating a short URL and store it along with the URL data in Firestore.
- Visitor Device Fingerprinting: Capture device fingerprint of every visitor who clicks a shortened URL and store it in Firestore analytics, linked to the shortId.
- My Links Dashboard: Display a dashboard to the user showing only URLs associated with their anonymous token, and view click analytics of associated links.
- Admin Access and Oversight: Require admin to log in to a protected dashboard to view ALL links and analytics of ALL users, as well as each URL's creator and visitor device fingerprints.
- Admin Validation: Verify that the currently logged-in Firebase Auth user is an admin before rendering any data on the admin page.

## Style Guidelines:

- Primary color: Moderate blue (#5DADE2), evoking trust and security for anonymous users while suggesting authority for admins.
- Background color: Light blue (#EBF5FB), providing a soft and unobtrusive backdrop.
- Accent color: Orange (#F39C12), used to draw attention to important UI elements, but avoid using it in a way that might exhaust the user.
- Font: 'Inter', a sans-serif font known for its modern, neutral appearance that works well for both headlines and body text.
- Simple, clear icons for link management, emphasizing ease of use. Prefer the use of standard hyperlink icons (an angled chain), for high recognizability and usability. Avoid visual clutter.
- Clean and straightforward layout to emphasize simplicity, allowing both anonymous and authenticated users to quickly get started with a minimum of friction.