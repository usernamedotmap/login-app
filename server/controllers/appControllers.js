import UserModel from "../model/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ENV from "../config.js";
import optGenerator from 'otp-generator'

/** middleware for verify user */
export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method === "GET" ? req.query : req.body;

    // chech the user existance

    let exist = await UserModel.findOne({ username });
    if (!exist) return res.status(404).send({ error: "Can't find user!" });

    next();
  } catch (error) {
    res.status(404).send({ error: "Authentication Error" });
  }
}

/** POST: http://localhost:8080/api/register 
  @param : {
  "username": "example123",
  "password": "admin123",
   "email": "example@gmail.com",
  "firstName"; "abkti",
  "lastName": "ako?",
  "mobile": 80808080,
  "address": "satayap st.",
  "profile": ""
}
*/

export async function register(req, res) {
  try {
    const { username, password, profile, email } = req.body;

    // check the existing user
    const existUsername = await UserModel.findOne({ username });
    if (existUsername) {
      return res.status(500).send({ error: "Please use unique Username" });
    }

    // check the existing email
    const existEmail = await UserModel.findOne({ email });
    if (existEmail) {
      return res.status(500).send({ error: "Please use unique Email" });
    }

    let hashedPassword = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the raw password, not the hashed one
    }

    const newUser = new UserModel({
      username,
      password: hashedPassword,
      profile: profile || "",
      email,
    });

    await newUser.save();

    return res.status(201).send({ msg: "User Register Successfully" });
  } catch (error) {
    console.error("Unable to hash password", error);
    return res.status(500).send(error);
  }
}

/** POST: http://localhost:8080/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/

export async function login(req, res) {
    const { username, password } = req.body;

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).send({ error: "Username not found" });
        }

        console.log("Hashed Password from Database:", user.password);

        bcrypt.compare(password, user.password)
            .then(passwordCheck => {
                console.log("Password Comparison Result:", passwordCheck);

                if (!passwordCheck) {
                    return res.status(400).send({ error: "Password doesn't match" });
                }

                const token = jwt.sign({
                    userId: user._id,
                    username: user.username
                }, ENV.JWT_SECRET, { expiresIn: "24h" });

                return res.status(200).send({
                    msg: "Login Successful...!",
                    username: user.username,
                    token
                });
            })
            .catch(error => {
                console.error("Error comparing passwords:", error);
                return res.status(500).send({ error: "Internal Server Error" });
            });
    } catch (error) {
        console.error("Error finding user:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}

export async function getUser(req, res) {
  const { username } = req.params;

  try {
    if (!username) return res.status(501).send({ error: "Invalid U sername" });

    const user = await UserModel.findOne({ username });
    if (!user) return res.status(400).send({ error: "User not found" });

    const { password, ...rest } = Object.assign({}, user.toJSON());

    return res.status(201).send(rest);
  } catch (error) {
    return res.status(404).send({ error: "Cannot Find User Data" });
  }
}

export async function updateUser(req, res) {
  try {
    const {userId} = req.user;

    if (userId) {
      const body = req.body;

      // Update the user data
      const updatedUser = await UserModel.findByIdAndUpdate(userId, body, { new: true });

      if (updatedUser) {
        return res.status(201).send({ msg: "Record Updated", user: updatedUser });
      } else {
        return res.status(404).send({ error: "User not found" });
      }
    } else {
      return res.status(400).send({ error: "Invalid request, user ID not provided" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Internal Server Error" });
  }
}


export async function generateOTP(req, res) {
  req.app.locals.OTP = await optGenerator.generate(6, {lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false});
  res.status(201).send({ code: req.app.locals.OTP})

}

export async function verifyOTP(req, res) {
  const {code } = req.query;
  if(parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start the session for reset password
    return res.status(201).send({ msg: "Verify Successfully"})
  } else {
  return res.status(400).send({ error: "Invalid OTP"})
  }
}

export async function createResetSession(req, res) {
  if(req.app.locals.resetSession) {
    return res.status(201).send({flag : req.app.locals.resetSession})
  } else {
    return res.status(400).send({error: "Session Expired"})
  }
}

export async function resetPassword(req, res) {
    try {
        // Check if reset session is active
        if (!req.app.locals.resetSession) {
            return res.status(400).send({ error: "Session expired" });
        }

        const { username, password } = req.body;

        // Find the user in the database
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: "Username not found" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        await UserModel.updateOne({ username: user.username }, { password: hashedPassword });

        // Reset the resetSession flag
        req.app.locals.resetSession = false;

        return res.status(201).send({ msg: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}
