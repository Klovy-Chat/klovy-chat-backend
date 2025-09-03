import User from "../../model/UserModel.js";

const getAllContacts = async (request, response, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: request.userId } },
      "firstName lastName _id",
    );

    const contacts = users.map((user) => {
      let label = "";

      if (user.firstName && user.lastName) {
        label = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        label = user.firstName;
      } else if (user.lastName) {
        label = user.lastName;
      } else {
        label = "Unknown";
      }
      
      return {
        label,
        value: user._id,
      };
    });

    return response.status(200).json({ contacts });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export default getAllContacts;
