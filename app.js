require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');


// =====================================================================
// Setup the express app
const app = express();

const hostUrl = process.env.WEBSERVER_URL; 
const port = process.env.WEBSERVER_PORT;
const staticDicrectory = process.env.STATIC_DIRECTORY;
const mongoDbUrl = process.env.MONGO_DB_URL;

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static(staticDicrectory));


// =====================================================================
// Setup MongoDB database
mongoose.connect(mongoDbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Create MongoDB schema for questions
const questionSchema = mongoose.Schema({
    category: String,
    title: String,
    body: String,
    answer: String
});

// Create a model and MongoDB collection for questions
const Question = mongoose.model("Question", questionSchema);


// =====================================================================
// Test data
const questions = [
    { category: "Study", title: 'Question 1', body: 'This is a question?', answer: 'Yes' },
    { category: "Study", title: 'Question 2', body: 'This is a question?', answer: 'Maybe' },
    { category: "Study", title: 'Question 3', body: 'This is a question?', answer: 'No' },

    { category: "Study", title: 'Question 4', body: 'This is a question?', answer: 'Yes' },
    { category: "Study", title: 'Question 5', body: 'This is a question?', answer: 'Maybe' },
    { category: "Study", title: 'Question 6', body: 'This is a question?', answer: 'No' },

    { category: "Study", title: 'Question 7', body: 'This is a question?', answer: 'Yes' },
    { category: "Study", title: 'Question 8', body: 'This is a question?', answer: 'Maybe' },
    { category: "Study", title: 'Question 9', body: 'This is a question?', answer: 'No' },

    { category: "Test", title: 'Question 1', body: 'This is a question?', answer: 'Yes' },
    { category: "Cooking", title: 'Question 1', body: 'This is a question?', answer: 'Maybe' },
    { category: "Test", title: 'Question 2', body: 'This is a question?', answer: 'No' },

    { category: "Study", title: 'Question 10', body: 'This is a question?', answer: 'Yes' },
    { category: "Study", title: 'Question 11', body: 'This is a question?', answer: 'Maybe' },
    { category: "Study", title: 'Question 12', body: 'This is a question?', answer: 'No' },
];

// Determine whether or not to seed the collection with test data
Question.find({}, (err, foundQuestions) => {
    if (err) {
        console.log(err);
    } else {
        if (foundQuestions.length === 0) {
            questions.forEach(x => {
                const newQuestion = new Question({
                    category: x.category,
                    title: x.title,
                    body: x.body,
                    answer: x.answer,
                });
                
                newQuestion.save();
                
                console.log(`Saved new model with title: ${x.title}`);
            });
        } else {
            console.log("questions collection in flashcardsDB is already seeded!");
        }
    }
});


// =====================================================================
// Route endpoints
app.route('/')
    .get((req, res) => {
        Question.find({}, (err, foundQuestions) => {
            if (err) {
                console.log(err);

                res.statusCode = 503;
                res.redirect('/');
            } else {
                res.render('home');
            }
        });
    });


app.route('/flashcards')
    .get((req, res) => {
        Question
            .find()
            .distinct('category', (err, categories) => {
                if (err) {
                    console.log(err);
                    
                    res.statusCode = 503;
                    res.redirect('/');
                } else {
                    res.render('categories', { categories: categories });
                }
            });
    });
   

app.route('/flashcards/:category')
    .get((req, res) => {
        const category = req.params.category;
        
        Question.find({ category: category }, (err, foundQuestions) => {
            if (err) {
                console.log(err);
                
                res.statusCode = 503;
                res.redirect('/');
            } else if (foundQuestions.length === 0) {
                res.redirect('/flashcards');
            } else {
                res.render('category', { questions: foundQuestions });
            }
        });
    });


app.route('/compose')
    .get((req, res) => {
        res.render('compose-flash-card');
    })
    .post((req, res) => {
        const category = req.body.questionCategory;
        const title = req.body.questionTitle;
        const body = req.body.questionBody;
        const answer = req.body.questionAnswer;

        const question = new Question({
            category: category,
            title: title,
            body: body,
            answer: answer
        });

        question.save();
        
        res.redirect(`/flashcards/${category}`);
    });


app.route('/edit/:category/:qid')
    .get((req, res) => {
        const category = req.params.category;
        const qid = req.params.qid;
        
        Question.findOne({ _id: qid }, (err, foundQuestion) => {
            if (err) {
                console.log(err);

                res.statusCode = 503;
                res.redirect(`/flashcards/${category}`);
            } else if (foundQuestion === null) {
                res.statusCode = 404;
                res.render("404", {
                    statusCode: res.statusCode, 
                    statusMessage: 'Page Not Found', 
                    message: "This isn't the page you were looking for.", 
                });
            } else {
                res.render('edit-flash-card', { question: foundQuestion });
            }
        });
    })
    .post((req, res) => {
        const category = req.params.category;
        const qid = req.params.qid;

        const updatedCategory = req.body.questionCategory;
        const updatedTitle = req.body.questionTitle;
        const updatedBody = req.body.questionBody;
        const updatedAnswer = req.body.questionAnswer;

        Question.updateOne(
            { _id: qid },
            { 
                category: updatedCategory,
                title: updatedTitle,
                body: updatedBody,
                answer: updatedAnswer,
            },
            (err, result) => {
            if (err) {
                console.log(err);
                
                res.statusCode = 503;
                res.redirect('/');
            } else {
                // console.log(`updated: ${result}`);

                res.redirect(`/flashcards/${category}`);
            }
        });
    });


app.route('/delete/:category/:qid')
    .get((req, res) => {
        const category = req.params.category;
        const qid = req.params.qid;

        Question.deleteOne({ _id: qid }, (err) => {
            if (err) {
                console.log(err);

                res.statusCode = 503;
                res.redirect(`/flashcards/${category}`);
            } else {
                res.redirect(`/flashcards/${category}`);
            }
        })
    });


app.route('*')
    .get((req, res) => {
        res.statusCode = 404;
        res.render('404', { 
            statusCode: res.statusCode, 
            statusMessage: 'Page Not Found', 
            message: "This isn't the page you were looking for.", 
        });
    });


// =====================================================================
// Start the webserver
app.listen(port, () => {
    console.log(`Server started at: ${hostUrl}:${port}/`);
});