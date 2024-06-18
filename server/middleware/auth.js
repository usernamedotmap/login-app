import jwt from "jsonwebtoken";
import ENV from "../config.js";

/** auth middleware */

export default async function Auth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];

    // retrive the users deailts for the logged in
    const decodedToken = await jwt.verify(token, ENV.JWT_SECRET);

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).send({ error: "AUthentication failed" });
  }
}

export function localVariable(req, res, next) {
  req.app.locals = {
    OTP: null,
    resetSession: false
  }
  next();
}