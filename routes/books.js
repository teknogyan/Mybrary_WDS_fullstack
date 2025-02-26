const express = require("express");
const router = express.Router();
const Books = require("../models/book");
console.log(Books);
const Author = require("../models/author");
const multer = require("multer"); // library to handle multipart form that may contain images
const path = require("path");
const book = require("../models/book");
const { error } = require("console");
const fileUploadPath = path.join("public", Books.coverImgDir);

const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"]; // allowed images files formats for upload
const upload = multer({
  dest: fileUploadPath,
  fileFilter: (req, file, callback) => {
    if (imageMimeTypes.indexOf(file.mimetype) == -1) {
      callback(null, false);
    } else {
      callback(null, true);
    }
  },
});

// GET Route to load books page
router.get("/", async (req, res) => {
  const bookToFind = {}
  if(req.query.bookToFind) bookToFind = req.query.bookToFind;
  console.log("Book To find: ", bookToFind);
  const books = await findBooks(bookToFind);
  // console.log("books recieved form DB", books);
  res.render("books", { books: books, bookToFind, error: null });
});

router.get("/new", async (req, res) => {
  try {
    const authors = await Author.find({});
    res.render("books/new", { authors: authors });
  } catch (err) {
    res.redirect("/books");
  }
});

// Route for creating new book
router.post("/", upload.single("thumbnail"), async (req, res) => {
  console.log(req.file);
  const filename = req.file != null ? req.file.filename : null;
  const {
    title,
    author: authorId,
    published,
    pages,
    created,
    description,
  } = req.body;
  const authorObj = await Author.findById(authorId);
  console.log(
    title,
    authorObj,
    authorId,
    pages,
    published,
    created,
    description,
    req.file
  );

  const book = new Books({
    title: title,
    publishedDate: new Date(published),
    pageCount: pages,
    // setting the property as undefined so that default value is set if empty value or null is passed
    createdAt: !created ? undefined : new Date(created),
    author: authorObj,
    description: description,
    thumbnail: filename,
  });

  try {
    await book.save();
    res.redirect("/books");
  } catch (err) {
    console.log("error saving book:", err);
    res.render("books/new", { book, error: err });
  }
});

router.post("/delete", async (req, res) => {
  console.log(req.body.id);
  const bookId = req.body.id;
  try {
    await Books.deleteOne({_id: bookId})
    res.redirect("/books")
  } catch (error) {
    const books = await findBooks({})
    res.render("books", {books, error: "Sorry, Couldn't Delete!", bookToFind: null})
  }
});

const findBooks = async (bookToFind) => {
  const books = await Books.find(bookToFind).populate("author");
  return books;
}

module.exports = router;
