const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 1,
    });

    return res.status(200).send("Logout successful");
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

export default logout;
