const mongoose = require('mongoose');

const url = "mongodb+srv://lawyn:Papameu123!@cluster0.px8nd.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "Doppy" }).then((db) => {
    console.log("Connected to database: " + db.connection.name);
});

module.exports.db = mongoose;