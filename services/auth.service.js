const bcrypt = require("bcryptjs");

const User = require("../models/user.model.js");
const AppError = require("../utils/app-error.js");
const generateToken = require("../utils/generateToken.js");

const sanitizeUser = (user) => {
  const safeUser = user.toObject();

  delete safeUser.password;

  return safeUser;
};

const registerUser = async ({
  firstName,
  lastName,
  userName,
  email,
  password,
  gender,
  phone,
  address,
}) => {
  if (
    !firstName ||
    !lastName ||
    !userName ||
    !email ||
    !password ||
    !gender ||
    !phone ||
    !address
  ) {
    throw AppError.badRequest("All fields are required");
  }

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 20
  ) {
    throw AppError.badRequest(
      "Password must be between 6 and 20 characters"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUserName = userName.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { userName: normalizedUserName },
      { phone: phone.trim() },
    ],
  });

  if (existingUser) {
    throw AppError.conflict(
      "Username, email, or phone number already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    userName: normalizedUserName,
    email: normalizedEmail,
    password: hashedPassword,
    gender,
    phone: phone.trim(),
    address: address.trim(),
    role: "user",
  });

  return sanitizeUser(user);
};

const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw AppError.badRequest(
      "Email or username and password are required"
    );
  }

  const normalizedIdentifier = String(identifier)
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier },
      { userName: normalizedIdentifier },
    ],
  }).select("+password");

  if (!user) {
    throw AppError.unauthorized("Invalid credentials");
  }

  if (!user.isActive) {
    throw AppError.forbidden(
      "Your account has been deactivated"
    );
  }

  const passwordMatch = await bcrypt.compare(
    String(password),
    user.password
  );

  if (!passwordMatch) {
    throw AppError.unauthorized("Invalid credentials");
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound("User");
  }

  if (!user.isActive) {
    throw AppError.forbidden(
      "Your account has been deactivated"
    );
  }

  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};