import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import bcrypt from "bcrypt"; // Ensure bcrypt is imported for password hashing
import axios from "axios";
import he from "he";

env.config();
const app = express();
const port = 3000;

// Database configuration and connection
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  max: 10
});
const apiKey=process.env.GOOGLE_BOOKS_APIKEY
db.connect();

// Middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', async (req, res) => {

  
    try {
      const booksRetrieve = await db.query("SELECT id, name,author FROM books limit 10");
      const discussRetrieve = await db.query("SELECT user_id, book_id, text FROM discussions order by created_at  limit 12");

      return res.render("home.ejs", { books: booksRetrieve.rows ,discussions:discussRetrieve.rows,isUser:req});

  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving books");
  }
  
  
 
});



app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});



app.post('/book', async (req, res) => {
  try {
    // Check if 'book_id' is provided
    let discussionResult;
    const bookId = req.body.book_id;

    // Fetch the book from the database using the 'book_id'
    const bookResult = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = bookResult.rows[0];

    if (!book) {
      return res.status(404).send("Book not found");
    }

    const normalizedBookName = book.normalized_name;  // Use normalized name from DB

    // Fetch discussions related to this book
    discussionResult = await db.query("SELECT * FROM discussions WHERE book_id = $1", [bookId]);

    // Query Google Books API using the normalized book name
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${book.name}&key=${apiKey}&maxResults=1`);
    console.log(book.name);

    if (response.data.totalItems > 0) {
      const googlebook = response.data.items[0].volumeInfo;

      const smallThumbnail = googlebook.imageLinks?.smallThumbnail || "No small thumbnail available";
      const thumbnail = googlebook.imageLinks?.thumbnail || "No thumbnail available";
      let description = googlebook.description || "No description available";

      // Decode the description (HTML encoded)
      description = he.decode(description);

      // Google Books data to pass to the template
      const fromGoogle = {
        smallThumbnail,
        thumbnail,
        description
      };

      // Render the book page with the book, discussions, and Google Books data
      res.render("book.ejs", {
        isAuthenticated: req.isAuthenticated(), 
        book,
        discussions: discussionResult.rows,
        googleBooks: fromGoogle
      });

    } else {
      // If no book found on Google Books
      res.render("book.ejs", {
        isAuthenticated: req.isAuthenticated(), 
        book,
        discussions: discussionResult.rows,
        googleBooks: {
          smallThumbnail: "No small thumbnail available",
          thumbnail: "No thumbnail available",
          description: "No description available"
        }
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading book details");
  }
});


app.post('/search', async (req, res) => {
  try {
    let book;
    

    // Function to normalize book titles
    const normalizeTitle = (title) => {
      return title.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
                  .replace(/\b(?:the|in|a|and|of|to|for|is|on|it|with|that|this|by|from|an|as|are|at|but)\b/g, '') // Remove stop words
                  .replace(/\s+/g, '') // Remove all spaces
                  .trim();
    };
    
    let normalizedBookName;

if (req.body.query) {
      // If 'query' is provided (from search bar), search by book name
      const bookName = req.body.query;

      // Normalize the search query to increase matching chances
      const normalizedSearchQuery = normalizeTitle(bookName);

      // Query the database for the most similar book
      const bookResult = await db.query(
        `SELECT * FROM books 
         WHERE similarity(normalized_name, $1) > 0.4
         ORDER BY similarity(normalized_name, $1) DESC 
         LIMIT 10;`,
        [normalizedSearchQuery]
      );

      book = bookResult.rows
      console.log(book);

      if (!book) {
        return res.status(404).send("No book found with that name");
      }

      return res.render("search_result.ejs", { 
        isAuthenticated: req.isAuthenticated(), 
        books: book
      });





    } else {
      // If neither 'book_id' nor 'query' is provided, return an error
      return res.status(400).send("Invalid request: missing book search criteria");
    }

    // Now, we query Google Books using the normalized book name from the database
   

  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching for book");
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Get replies for a specific discussion
app.get('/get-replies', async (req, res) => {
  const { parent_id: parentId, discuss_id: discussId } = req.query;

  try {
    const query = parentId !== "null" 
      ? 'SELECT * FROM replies WHERE parent_id = $1 AND discuss_id = $2'
      : 'SELECT * FROM replies WHERE parent_id IS NULL AND discuss_id = $1';

    const params = parentId !== "null" ? [parentId, discussId] : [discussId];
    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error querying replies:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Post a discussion
app.post('/post-discuss', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect("/login"); // Redirect to login if user is not authenticated
  }

  const { book_id, text } = req.query;
  const userId = req.user.user_id; // Use the logged-in user's ID

  console.log(`user id is ${userId}`);

  

  try {
    await db.query("INSERT INTO discussions (user_id, book_id, text) VALUES ($1, $2, $3)", [userId, book_id, text]);
    await db.query("UPDATE Books SET discussion_count = discussion_count + 1 WHERE id = ($1)",[book_id]);
    res.status(200).send("Discussion posted successfully");
  } catch (err) {
    console.error("Error posting discussion:", err);
    res.status(500).send("Failed to post discussion");
  }
});


// Post a reply
app.post('/post-reply', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login"); // Redirect to login if user is not authenticated
  }

  const { discuss_id, parent_id, text } = req.query;
  const userId = req.user.user_id; // Use the logged-in user's ID

  console.log(`user id is ${userId}`);


  try {
    const query = parent_id !== 'null'
      ? 'INSERT INTO replies (discuss_id, parent_id, text, user_id) VALUES ($1, $2, $3, $4)'
      : 'INSERT INTO replies (discuss_id, text, user_id) VALUES ($1, $2, $3)';
    
    const params = parent_id !== 'null' ? [discuss_id, parent_id, text, userId] : [discuss_id, text, userId];
    await db.query(query, params);

    res.status(200).send("Reply posted successfully");
  } catch (err) {
    console.error("Error posting reply:", err);
    res.status(500).send("Failed to post reply");
  }
});


app.get("/register",async(req,res)=>{
  res.render("register.ejs");
})
app.get("/login",async(req,res)=>{
  res.render("login.ejs");
})

// Register a user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [username]);

    if (checkResult.rows.length > 0) {
      return res.redirect("/login"); // Redirect if user already exists
    }

    // Hash the password
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.redirect("/register"); // Redirect back to register on error
      }

      // Insert the new user into the database
      const result = await db.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *", 
        [username, hash]
      );

      // Log in the user automatically after registration
      req.login(result.rows[0],async (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return res.redirect("/login");
        }
        
        
       res.redirect("/");



      });
    });

  } catch (err) {
    console.error("Error registering user:", err);
    res.redirect("/register"); // Redirect back to register on error
  }
});

// Login a user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [username]);

    if (checkResult.rows.length === 0) {
      return res.redirect("/login"); // Redirect if user doesn't exist
    }

    // Compare the provided password with the stored password hash
    const user = checkResult.rows[0];
    bcrypt.compare(password, user.password_hash, async (err, isMatch) => {
      if (err) {
        console.error("Error comparing password:", err);
        return res.redirect("/login"); // Redirect back to login on error
      }

      if (!isMatch) {
        return res.redirect("/login"); // Redirect if password doesn't match
      }

      // Log in the user if the password matches
      req.login(user, async (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return res.redirect("/login");
        }

        res.redirect("/"); // Redirect to homepage after successful login
      });
    });

  } catch (err) {
    console.error("Error logging in user:", err);
    res.redirect("/login"); // Redirect back to login on error
  }
});



// Passport Local Strategy
passport.use("local", new LocalStrategy(async (username, password, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) return cb("User not found");

    const user = result.rows[0];
    bcrypt.compare(password, user.password_hash, (err, valid) => {
      if (err) return cb(err);
      if (valid) return cb(null, user);
      return cb(null, false);
    });
  } catch (err) {
    console.error(err);
    return cb(err);
  }
}));



app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);


// Passport Google Strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);




// passport.serializeUser((user, cb) => cb(null, user));
// passport.deserializeUser((user, cb) => cb(null, user));

passport.serializeUser((user, done) => {
  // console.log(user.user_id); // Check the structure of the user object
  done(null, user.user_id);  // Store user ID in the session
});



passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [id]);
    // console.log(result);
    done(null, result.rows[0]);  // Attach the full user object to req.user
  } catch (err) {
    done(err);
  }
});



// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
