VidioSphere Firebase Starter
A functional starter for a public video-sharing platform.
Features included
Google authentication
Channel creation after login
Phone verification flow
Video upload to Firebase Storage
Custom thumbnail upload after phone verification
Firestore video metadata
Public video playback
Search and categories
Views
Likes / dislikes
Comments
Subscribe / unsubscribe
Share link
Remix workflow (stores the source video ID)
Creator channel page
Responsive UI
Firebase Console setup
Create/open the Firebase project used by this code.
Authentication -> Sign-in method:
Enable Google.
Enable Phone.
Firestore Database -> Create database.
Storage -> Get started.
Publish firestore.rules and storage.rules.
For phone authentication on localhost, add your local development domain in Authentication -> Settings -> Authorized domains if needed.
For production, use HTTPS and configure your production domain.
Open the site through a local web server. Do NOT double-click index.html because ES modules/Firebase can be blocked by browser file restrictions.
Run locally
Use VS Code Live Server, Firebase Hosting, or another local HTTP server.
Example with Python: python -m http.server 5500
Then open: http://localhost:5500
Important production work still needed
This is a working foundation, not a complete YouTube-scale service. Before public launch add:
server-side video transcoding (HLS/DASH) and multiple resolutions
CDN delivery
moderation/reporting/admin tools
abuse/rate limiting
copyright/Content ID-style systems
notifications
playlists/watch history
creator analytics
Shorts processing
live streaming
monetization/ad system
stronger Storage/Firestore validation and App Check
privacy/terms/DMCA processes
production-scale search and recommendations
Never put service-account private keys in frontend code. The Firebase web API key is not a substitute for security rules.
