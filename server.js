import app from "./src/app.js";
import authRoutes from './src/routes/authRoutes.js';
import movementRoutes from './src/routes/movementRoutes.js'; 
import orderRoutes from './src/routes/orderRoutes.js';

app.use('/auth', authRoutes);
app.use('/movements', movementRoutes);
app.use('/orders', orderRoutes);


app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});