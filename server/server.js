import express from "express";
import dbConnect from "./config/database.js";
import userRouter from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import providerProfileRouter from "./routes/providerProfile.route.js";
import bookingRouter from "./routes/booking.route.js";
import commentRouter from "./routes/comment.routes.js";
import cors from "cors";

const app = express();

// ✅ CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend origin
    credentials: true, // allow cookies and auth headers
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ✅ API routes
app.use('/api/user', userRouter);
app.use('/api/provider-profile', providerProfileRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/comments', commentRouter);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is live");
});

// ✅ Connect to database
dbConnect();

app.listen(port, () => {
  console.log(`Server is listening at port: ${port}`);
});
