import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import movementRoutes from "./routes/movementRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/movements", movementRoutes);

app.use("/products", productRoutes);

export default app;