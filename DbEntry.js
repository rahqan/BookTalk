import express from "express";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Initialize PostgreSQL client
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Function to normalize book titles
const normalizeTitle = (title) => {
    return title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
                .replace(/\b(the|in|a|and|of|to|for|is|on|it|with|that|this|by|from|an|as|are|at|but)\b/g, '') // Remove common stop words
                .replace(/\s+/g, '') // Remove all spaces
                .trim();
  };
  
  

// Function to insert books into the database
const insertBooks = async () => {
    // Array of books with names and authors
    const books = [
        { name: 'The Catcher in the Rye', author: 'J.D. Salinger' },
        { name: 'To Kill a Mockingbird', author: 'Harper Lee' },
        { name: '1984', author: 'George Orwell' },
        { name: 'Pride and Prejudice', author: 'Jane Austen' },
        { name: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
        { name: 'Lord of the Rings', author: 'J.R.R. Tolkien' },
        { name: 'The Hobbit', author: 'J.R.R. Tolkien' },
        { name: 'Animal Farm', author: 'George Orwell' },
        { name: 'Brave New World', author: 'Aldous Huxley' },
        { name: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez' },
        { name: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
        { name: 'Jane Eyre', author: 'Charlotte Brontë' },
        { name: 'Wuthering Heights', author: 'Emily Brontë' },
        { name: 'The Lord of the Flies', author: 'William Golding' },
        { name: 'The Grapes of Wrath', author: 'John Steinbeck' },
        { name: 'Of Mice and Men', author: 'John Steinbeck' },
        { name: 'The Old Man and the Sea', author: 'Ernest Hemingway' },
        { name: 'A Farewell to Arms', author: 'Ernest Hemingway' },
        { name: 'For Whom the Bell Tolls', author: 'Ernest Hemingway' },
        { name: 'Fahrenheit 451', author: 'Ray Bradbury' },
        { name: 'The Chronicles of Narnia', author: 'C.S. Lewis' },
        { name: 'Dune', author: 'Frank Herbert' },
        { name: 'The Handmaid\'s Tale', author: 'Margaret Atwood' },
        { name: 'Catch-22', author: 'Joseph Heller' },
        { name: 'Slaughterhouse-Five', author: 'Kurt Vonnegut' },
        { name: 'The Bell Jar', author: 'Sylvia Plath' },
        { name: 'The Color Purple', author: 'Alice Walker' },
        { name: 'The Road', author: 'Cormac McCarthy' },
        { name: 'No Country for Old Men', author: 'Cormac McCarthy' },
        { name: 'Blood Meridian', author: 'Cormac McCarthy' },
        { name: 'The Sound and the Fury', author: 'William Faulkner' },
        { name: 'As I Lay Dying', author: 'William Faulkner' },
        { name: 'The Sun Also Rises', author: 'Ernest Hemingway' },
        { name: 'The Count of Monte Cristo', author: 'Alexandre Dumas' },
        { name: 'The Three Musketeers', author: 'Alexandre Dumas' },
        { name: 'Don Quixote', author: 'Miguel de Cervantes' },
        { name: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
        { name: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky' },
        { name: 'War and Peace', author: 'Leo Tolstoy' },
        { name: 'Anna Karenina', author: 'Leo Tolstoy' },
        { name: 'Lolita', author: 'Vladimir Nabokov' },
        { name: 'The Trial', author: 'Franz Kafka' },
        { name: 'The Metamorphosis', author: 'Franz Kafka' },
        { name: 'Moby-Dick', author: 'Herman Melville' },
        { name: 'The Adventures of Huckleberry Finn', author: 'Mark Twain' },
        { name: 'The Adventures of Tom Sawyer', author: 'Mark Twain' },
        { name: 'Heart of Darkness', author: 'Joseph Conrad' },
        { name: 'Les Misérables', author: 'Victor Hugo' },
        { name: 'The Hunchback of Notre-Dame', author: 'Victor Hugo' },
        { name: 'The Portrait of a Lady', author: 'Henry James' },
        { name: 'The Turn of the Screw', author: 'Henry James' },
        { name: 'A Tale of Two Cities', author: 'Charles Dickens' },
        { name: 'Great Expectations', author: 'Charles Dickens' },
        { name: 'David Copperfield', author: 'Charles Dickens' },
        { name: 'Oliver Twist', author: 'Charles Dickens' },
        { name: 'The Scarlet Letter', author: 'Nathaniel Hawthorne' },
        { name: 'The House of Seven Gables', author: 'Nathaniel Hawthorne' },
        { name: 'Frankenstein', author: 'Mary Shelley' },
        { name: 'Dracula', author: 'Bram Stoker' },
        { name: 'The Strange Case of Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson' },
        { name: 'Treasure Island', author: 'Robert Louis Stevenson' },
        { name: 'Robinson Crusoe', author: 'Daniel Defoe' },
        { name: 'Gulliver\'s Travels', author: 'Jonathan Swift' },
        { name: 'The Time Machine', author: 'H.G. Wells' },
        { name: 'The War of the Worlds', author: 'H.G. Wells' },
        { name: 'The Invisible Man', author: 'H.G. Wells' },
        { name: 'Twenty Thousand Leagues Under the Sea', author: 'Jules Verne' },
        { name: 'Journey to the Center of the Earth', author: 'Jules Verne' },
        { name: 'Around the World in Eighty Days', author: 'Jules Verne' },
        { name: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll' },
        { name: 'Through the Looking-Glass', author: 'Lewis Carroll' },
        { name: 'The Wind in the Willows', author: 'Kenneth Grahame' },
        { name: 'Peter Pan', author: 'J.M. Barrie' },
        { name: 'The Little Prince', author: 'Antoine de Saint-Exupéry' },
        { name: 'The Name of the Rose', author: 'Umberto Eco' },
        { name: 'The Master and Margarita', author: 'Mikhail Bulgakov' },
        { name: 'One Day in the Life of Ivan Denisovich', author: 'Alexander Solzhenitsyn' },
        { name: 'Doctor Zhivago', author: 'Boris Pasternak' },
        { name: 'The Plague', author: 'Albert Camus' },
        { name: 'The Stranger', author: 'Albert Camus' },
        { name: 'Nausea', author: 'Jean-Paul Sartre' },
        { name: 'The Tin Drum', author: 'Günter Grass' },
        { name: 'The Magic Mountain', author: 'Thomas Mann' },
        { name: 'Death in Venice', author: 'Thomas Mann' },
        { name: 'Siddhartha', author: 'Hermann Hesse' },
        { name: 'Steppenwolf', author: 'Hermann Hesse' },
        { name: 'The Glass Bead Game', author: 'Hermann Hesse' },
        { name: 'The Unbearable Lightness of Being', author: 'Milan Kundera' },
        { name: 'If on a winter\'s night a traveler', author: 'Italo Calvino' },
        { name: 'Invisible Cities', author: 'Italo Calvino' },
        { name: 'Midnight\'s Children', author: 'Salman Rushdie' },
        { name: 'The Satanic Verses', author: 'Salman Rushdie' },
        { name: 'The God of Small Things', author: 'Arundhati Roy' },
        { name: 'Things Fall Apart', author: 'Chinua Achebe' },
        { name: 'The Joy Luck Club', author: 'Amy Tan' },
        { name: 'The House of the Spirits', author: 'Isabel Allende' },
        { name: 'Love in the Time of Cholera', author: 'Gabriel García Márquez' },
        { name: 'Chronicle of a Death Foretold', author: 'Gabriel García Márquez' },
        { name: 'The Autumn of the Patriarch', author: 'Gabriel García Márquez' },
        { name: 'Pedro Páramo', author: 'Juan Rulfo' },
        { name: 'The Alchemist', author: 'Paulo Coelho' },
        { name: 'Snow Country', author: 'Yasunari Kawabata' },
        { name: 'Norwegian Wood', author: 'Haruki Murakami' },
        { name: 'Kafka on the Shore', author: 'Haruki Murakami' },
        { name: 'The Wind-Up Bird Chronicle', author: 'Haruki Murakami' },
        { name: 'Never Let Me Go', author: 'Kazuo Ishiguro' },
        { name: 'The Remains of the Day', author: 'Kazuo Ishiguro' },
        { name: 'A Fine Balance', author: 'Rohinton Mistry' },
        { name: 'White Teeth', author: 'Zadie Smith' },
        { name: 'On Beauty', author: 'Zadie Smith' },
        { name: 'The Shadow of the Wind', author: 'Carlos Ruiz Zafón' },
        { name: 'The Kite Runner', author: 'Khaled Hosseini' },
        { name: 'A Thousand Splendid Suns', author: 'Khaled Hosseini' },
        { name: 'Life of Pi', author: 'Yann Martel' },
        { name: 'The Book Thief', author: 'Markus Zusak' },
        { name: 'The Night Circus', author: 'Erin Morgenstern' },
        { name: 'Cloud Atlas', author: 'David Mitchell' },
        { name: 'The Secret History', author: 'Donna Tartt' },
        { name: 'The Goldfinch', author: 'Donna Tartt' },
        { name: 'The Time Traveler\'s Wife', author: 'Audrey Niffenegger' },
        { name: 'Atonement', author: 'Ian McEwan' },
        { name: 'On Chesil Beach', author: 'Ian McEwan' },
        { name: 'Amsterdam', author: 'Ian McEwan' },
        { name: 'Enduring Love', author: 'Ian McEwan' },
        { name: 'Saturday', author: 'Ian McEwan' },
        { name: 'White Noise', author: 'Don DeLillo' },
        { name: 'Underworld', author: 'Don DeLillo' },
        { name: 'Infinite Jest', author: 'David Foster Wallace' },
        { name: 'The Corrections', author: 'Jonathan Franzen' },
        { name: 'Freedom', author: 'Jonathan Franzen' },
        { name: 'American Psycho', author: 'Bret Easton Ellis' },
        { name: 'Less Than Zero', author: 'Bret Easton Ellis' },
        { name: 'The Virgin Suicides', author: 'Jeffrey Eugenides' },
        { name: 'Middlesex', author: 'Jeffrey Eugenides' },
        { name: 'The Amazing Adventures of Kavalier & Clay', author: 'Michael Chabon' },
        { name: 'Wonder Boys', author: 'Michael Chabon' },
        { name: 'The Road Through the Wall', author: 'Shirley Jackson' },
        { name: 'The Haunting of Hill House', author: 'Shirley Jackson' },
        { name: 'We Have Always Lived in the Castle', author: 'Shirley Jackson' },
        { name: 'The Blind Assassin', author: 'Margaret Atwood' },
        { name: 'Oryx and Crake', author: 'Margaret Atwood' },
        { name: 'Cat\'s Eye', author: 'Margaret Atwood' },
        { name: 'The Robber Bride', author: 'Margaret Atwood' },
        { name: 'Alias Grace', author: 'Margaret Atwood' },
        { name: 'The Year of the Flood', author: 'Margaret Atwood' },
        { name: 'MaddAddam', author: 'Margaret Atwood' },
        { name: 'Rebecca', author: 'Daphne du Maurier' },
        { name: 'My Cousin Rachel', author: 'Daphne du Maurier' },
        { name: 'Jamaica Inn', author: 'Daphne du Maurier' },
        { name: 'The Birds and Other Stories', author: 'Daphne du Maurier' },
        { name: 'The Scapegoat', author: 'Daphne du Maurier' },
        { name: 'Franny and Zooey', author: 'J.D. Salinger' },
        { name: 'Nine Stories', author: 'J.D. Salinger' },
        { name: 'Raise High the Roof Beam, Carpenters', author: 'J.D. Salinger' },
        { name: 'Seymour: An Introduction', author: 'J.D. Salinger' }
        { name: 'A Study in Scarlet', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Sign of the Four', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Hound of the Baskervilles', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Valley of Fear', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Adventures of Sherlock Holmes', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Memoirs of Sherlock Holmes', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Return of Sherlock Holmes', author: 'Sir Arthur Conan Doyle' },
        { name: 'His Last Bow', author: 'Sir Arthur Conan Doyle' },
        { name: 'The Case-Book of Sherlock Holmes', author: 'Sir Arthur Conan Doyle' } 
    ];


    try {
      await db.connect(); // Connect to your database
  
      for (const book of books) {
        const normalizedBookName = normalizeTitle(book.name);
        await db.query(
          'INSERT INTO Books (name, normalized_name, author) VALUES ($1, $2, $3)', // Include author in the query
          [book.name, normalizedBookName, book.author] // Pass author as well
        );
      }
      console.log("Books inserted successfully.");
    } catch (err) {
      console.error("Error inserting books:", err);
    } finally {
      await db.end(); // Close the connection
    }
  };
  
// Start the server and insert books
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await insertBooks(); // Call the function to insert books when the server starts
});
