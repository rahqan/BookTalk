import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BookTalk",
  password: "astipur6542",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get('/',async(req,res)=>{

    let result=await(db.query("Select id,name,author from books"));
    let books = result.rows;
    // console.log(books);
    res.render("index.ejs", { books: books });
    // res.render("index.ejs");
})


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



// app.get('/get-replyreplies', async (req, res) => {
//     // const discussId = req.query.discuss_id;
//     const parentId = req.query.parent_id;
//     // console.log(discussId);
//     try {
//         // Query to get the replies where parent is NULL for the given discussion ID
//         const result = await db.query(
//             'SELECT * FROM replies WHERE  parent_id = $1', 
//             [parentId]
//         );

//         // Send the replies as a JSON response
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error querying the database:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });