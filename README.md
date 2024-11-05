

# Book Discussion Platform

This project is a web application that allows users to search for books, post discussions, and reply to others' comments. It integrates with Google Books API for additional book details and uses PostgreSQL for data management. Authentication is handled via local and Google OAuth2 strategies.

## Features

- **Book Search**: Search for books by title with results from the Google Books API if the book exists in the postgres database.
- **Discussions**: Users can start discussions about books and reply to each other's comments.
- **Replies**: Nested reply structure allows for threaded discussions like reddit.
- **Authentication**: Supports local login as well as Google OAuth2.

## Project Structure

- **`index.js`**: Main server file, sets up routes, database, and authentication strategies.
- **`book.js`**: Client-side JavaScript for handling discussion and reply loading and submission.


## Setup



1. **Environment Variables**: Create a `.env` file in the root directory with the following variables:
   ```bash
   PG_USER=<your-db-username>
   PG_HOST=<your-db-host>
   PG_DATABASE=<your-db-name>
   PG_PASSWORD=<your-db-password>
   PG_PORT=<your-db-port>
   SESSION_SECRET=<your-session-secret>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_BOOKS_APIKEY=<your-google-books-api-key>
   ```

2. **Run the Server**:
   ```bash
   npm start
   ```

3. **Access the Application**: Open your browser and go to `http://localhost:3000`.

## Usage

- **Search** for a book by title on the homepage.
- **View Book Details**: Click on a book to see details and start a discussion.
- **Post Discussions**: Authenticated users can post discussions about a book.
- **Reply to Discussions**: Users can reply to discussions, with support for nested replies.

## Technologies Used

- **Node.js & Express**: Backend framework and server setup.
- **PostgreSQL**: Database for storing books, discussions, and replies.
- **Passport.js**: For handling authentication (local and Google OAuth2).
- **Google Books API**: To fetch additional book information.

