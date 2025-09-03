import User from "../../model/UserModel.js";

const searchContacts = async (request, response, next) => {
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
            ą: "a",
            Ą: "A",
            ć: "c",
            Ć: "C",
            ę: "e",
            Ę: "E",
            ł: "l",
            Ł: "L",
            ń: "n",
            Ń: "N",
            ó: "o",
            Ó: "O",
            ś: "s",
            Ś: "S",
            ź: "z",
            Ź: "Z",
            ż: "z",
            Ż: "Z",
          };
          return polishCharsMap[char] || char;
        })
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    };

    const normalizedSearch = normalizeText(searchTerm);
    const allContacts = await User.find({ _id: { $ne: request.userId } });

    const exactMatchContacts = allContacts.filter((contact) => {
      if (!contact) return false;

      if (contact.nick && normalizeText(contact.nick) === normalizedSearch)
        return true;

      if (contact.firstName && contact.lastName) {
        const fullName = `${normalizeText(contact.firstName)} ${normalizeText(contact.lastName)}`;
        if (fullName === normalizedSearch) return true;
      }

      if (
        contact.firstName &&
        !contact.lastName &&
        normalizeText(contact.firstName) === normalizedSearch
      ) {
        return true;
      }

      return false;
    });

    const limitedResults = exactMatchContacts.slice(0, 10);
    
    return response.status(200).json({ contacts: limitedResults });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export default searchContacts;
