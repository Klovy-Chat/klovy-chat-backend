import jwt from "jsonwebtoken";
import User from "../../model/UserModel.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return User.findById(userId).then((user) => {
    const tokenVersion = user?.tokenVersion || 0;
    return jwt.sign({ email, userId, tokenVersion }, process.env.JWT_KEY, {
      expiresIn: maxAge,
    });
  });
};

export { createToken, maxAge };
