# 🔗 AnonLink

**AnonLink** is a privacy-aware URL shortener and analytics tool built with **Next.js** and **Firebase**. It allows users to shorten URLs without signing up, while tracking rich visitor data such as IP address, region, battery status, and device details.

## 🌟 Features

- **Anonymous User Token**  
  Automatically generates and stores a UUIDv4 token in local storage to identify users without requiring sign-up.

- **Instant URL Shortening**  
  Shorten links without creating an account — fast and frictionless.

- **Creator Fingerprinting**  
  Captures device fingerprint when a short URL is created, stored in Firestore along with the URL data.

- **Visitor Tracking**  
  Logs each visitor’s device fingerprint, including IP, region, battery level, and more, linked to the corresponding short URL.

- **My Links Dashboard**  
  Users can view and manage links associated with their anonymous token and see analytics for each.

- **Admin Dashboard**  
  Authenticated Firebase admins can access a protected dashboard to view:
  - All created links
  - All click analytics
  - Visitor and creator fingerprints

- **Admin Validation**  
  Verifies if the current Firebase Auth user has admin rights before allowing access to protected data.

## 🧰 Tech Stack

- **Framework**: Next.js
- **Backend & Auth**: Firebase (Firestore + Firebase Auth)
- **Hosting**: Vercel
- **Visitor Analytics**: Custom device fingerprinting

## 🚀 Live Demo

👉 [https://anon-link.vercel.app](https://anon-link.vercel.app)

## 🙋‍♂️ About the Developer
**[Shivam Kumar]** – Student Developer  
🔗 [LinkedIn](https://www.linkedin.com/in/shivadhruva)  
📧 [dhruvashivam@gmail.com](mailto:dhruvashivam@gmail.com)  
🌐 [My Portfolio](https://shivaarajput.github.io)


I'm a student developer passionate about full-stack development and user analytics.  
Currently open to **web development internship** opportunities!

Feel free to connect or provide feedback.
