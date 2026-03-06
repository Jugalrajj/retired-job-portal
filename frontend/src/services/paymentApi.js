import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/payment"
});

export const createOrder = (amount) =>
  API.post("/create-order", { amount });

export const verifyPayment = (data) =>
  API.post("/verify-payment", data);
