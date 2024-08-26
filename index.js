import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
db.connect();


// set up the github now working on the actual signup and then different users being able to write to db
// in furutre will add a real time chat feature


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get('/',async(req,res)=>{

    let result=await(db.query("Select id,name,author from books"));
    let books = result.rows;
    // console.log(books);
    res.render("login.ejs", { books: books });
    // res.render("index.ejs");
})
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });


app.post('/search',async(req,res)=>{

    // console.log(req.body.query);
    let bookName=req.body.query;
    // get book data
   let fromDb=await(db.query("Select * from books where name like '%' || $1 || '%';",[bookName]));
    let bookData = fromDb.rows[0];
    let bookId=bookData.id;
    // get discussions using the bookId
    fromDb=await(db.query("select * from discussions where book_id = ($1)",[bookId]));
    let discussion=fromDb.rows;

    // console.log(discussion);

    res.render("book.ejs",{book:bookData,discussions:discussion});
    // res.render("index.ejs");


})

app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );
  



// Route to get replies for a specific discussion
// ingternal ajax routye



app.get('/get-replies', async (req, res) => {
    let parentId = req.query.parent_id;
    // console.log(parentId);
    const discussId = req.query.discuss_id;

    if (parentId === "null") {
        parentId = null;
    }
    let result;

    try {
        // Query to get the replies for the given discussion ID and parent ID

        if (parentId !== null) {
            result = await db.query(
                'SELECT * FROM replies WHERE parent_id = $1 AND discuss_id = $2',
                [parentId, discussId]
            );
        } else {
            result = await db.query(
                'SELECT * FROM replies WHERE parent_id IS NULL AND discuss_id = $1',
                [discussId]
            );
        }

        // console.log()

        // Send the replies as a JSON response
        res.json(result.rows);
    } catch (err) {
        console.error('Error querying the database:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.post('/post-discuss', async (req, res) => {


    // if (req.query.discuss_id) {
    //     const { discuss_id, text } = req.query; 
    // }
    // else{

    // }
    
    const { book_id, text } = req.query; // Use req.body for data from POST requests if sent in body
    const userId = 1; // Replace with the actual user ID from the session

//     if (req.query.discuss_id) {
//         try {
//             await db.query(
//                 'INSERT INTO replies (discuss_id,user_id, text) VALUES ($1, $2, $3)',
//                 [discuss_id, userId, text]
//             );
//             res.status(200).send('Reply posted successfully');
//         } catch (error) {
//             console.error('Error posting reply:', error);
//             res.status(500).send('Failed to post reply');
//         }
//     }

// else{

    try {
        await db.query(
            'INSERT INTO discussions (user_id, book_id, text) VALUES ($1, $2, $3)',
            [userId, book_id, text]
        );
        res.status(200).send('Reply posted successfully');
    } catch (error) {
        console.error('Error posting reply:', error);
        res.status(500).send('Failed to post reply');
    }
// }
});




app.post('/post-reply', async (req, res) => {
    const { discuss_id, parent_id, text } = req.query; // Use req.body for POST data
    const userId = 1; // Replace with the actual user ID from the session
    console.log(parent_id);
    try {
        if (parent_id !== 'null') {
            console.log('fuck this');
            await db.query(
                'INSERT INTO replies (discuss_id, parent_id, text, user_id) VALUES ($1, $2, $3, $4)',
                [discuss_id, parent_id, text, userId]
            );
        } else {
            
             console.log('notme son');
             await db.query(
                'INSERT INTO replies (discuss_id, text, user_id) VALUES ($1, $2, $3)',
                [discuss_id, text, userId]
            );
        }
        res.status(200).send('Reply posted successfully');
    } catch (error) {
        // console.log('pewpewpew');
        console.error('Error posting reply:', error);
        res.status(500).send('Failed to post reply');
    }
});

app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/login");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/secrets");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });


  passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );

passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          // console.log(profile);
          const result = await db.query("SELECT * FROM users WHERE email = $1", [
            profile.email,
          ]);
          if (result.rows.length === 0) {
            const newUser = await db.query(
              "INSERT INTO users (email, password) VALUES ($1, $2)",
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
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
  

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });