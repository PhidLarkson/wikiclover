# WikiClover

**Capture the world for Wikimedia Commons.**

WikiClover is a modern Progressive Web App (PWA) that reimagines the experience of contributing to the world's largest free media repository. Inspired by premium social experiences, it makes browsing, capturing, and uploading heritage and nature photography seamless and beautiful.

## Features

*   **Smart Feed**: Discover high-quality images from around the world (and nearby!) in a swipeable, edge-to-edge feed.
*   **Nearby Discovery**: Find missing heritage sites around you using geolocation and contribute photos instantly.
*   **Guest Mode**: Explore the Commons without needing an account immediately.
*   **Accessibility First**: Built-in support for OpenDyslexic font, high contrast, reduced motion, and large text.

## contributing

We welcome contributions! Whether you're a developer, designer, or wikimedian, help us build the best contribution tool for the movement.

### Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/PhidLarkson/wikiclover.git
    cd wikiclover
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` to see the app.

### Setting up Authenticated Uploads

To test uploading features, you need a Wikimedia OAuth 2.0 consumer.
1.  Register a new tool at [meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose).
2.  Set the callback URL to `http://localhost:5173/auth/callback`.
3.  Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Add your Client ID to `.env`. (Client Secret is not required for this public client).



## License

This project is open source and available under the **MIT License**.
