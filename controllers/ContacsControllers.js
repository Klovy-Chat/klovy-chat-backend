import mongoose from "mongoose";
import User from "../model/UserModel.js";
import Message from "../model/MessagesModel.js";

export const getAllContacts = async (request, response, next) => {
  try {
    const users = await User.find(
        { _id: { $ne: request.userId } },
        "firstName lastName _id"
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

export const searchContacts = async (request, response, next) => {
  try {
    const { searchTerm } = request.body;

    if (searchTerm === undefined || searchTerm === null) {
      return response.status(400).send("Search Term is required.");
    }
    const normalizeText = (str) => {
      if (!str || typeof str !== "string") return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[ąĄćĆęĘłŁńŃóÓśŚźŹżŻ]/g, function (char) {
          const polishCharsMap = {
            "ą": "a", "Ą": "A", "ć": "c", "Ć": "C", "ę": "e", "Ę": "E",
            "ł": "l", "Ł": "L", "ń": "n", "Ń": "N", "ó": "o", "Ó": "O",
            "ś": "s", "Ś": "S", "ź": "z", "Ź": "Z", "ż": "z", "Ż": "Z"
          };
          return polishCharsMap[char] || char;
        })
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    };

    const normalizedSearch = normalizeText(searchTerm);
    const allContacts = await User.find({ _id: { $ne: request.userId } });
    const exactMatchContacts = allContacts.filter(contact => {
      if (!contact) return false;

      if (contact.nick && normalizeText(contact.nick) === normalizedSearch) return true;
      if (contact.firstName && contact.lastName) {
        const fullName = `${normalizeText(contact.firstName)} ${normalizeText(contact.lastName)}`;
        if (fullName === normalizedSearch) return true;
      }
      if (contact.firstName && !contact.lastName && normalizeText(contact.firstName) === normalizedSearch) return true;
      return false;
    });

    const limitedResults = exactMatchContacts.slice(0, 10);
    return response.status(200).json({ contacts: limitedResults });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export const getContactsForList = async (req, res, next) => {
  try {
    let { userId } = req;
    userId = new mongoose.Types.ObjectId(userId);

    if (!userId) {
      return res.status(400).send("User ID is required.");
    }
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,

          lastMessageTime: 1,
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error getting user contacts:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const contactId = req.params.contactId;
    if (!userId || !contactId) {
      return res.status(400).json({ message: "Missing user or contact id" });
    }
    await Message.deleteMany({
      $or: [
        { sender: userId, recipient: contactId },
        { sender: contactId, recipient: userId },
      ],
    });
    return res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
